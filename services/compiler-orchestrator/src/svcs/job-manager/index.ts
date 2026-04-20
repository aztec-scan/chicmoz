import { execFile } from "child_process";
import { mkdtemp, readFile, rm, stat } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import * as k8s from "@kubernetes/client-node";
import type { CompileSourceRequestEvent } from "@chicmoz-pkg/message-registry";
import type { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import type { SourceVerificationFailureStage } from "@chicmoz-pkg/types";
import { logger } from "../../logger.js";
import {
  COMPILER_IMAGE,
  EMPTYDIR_SIZE_LIMIT,
  IMAGE_PULL_SECRET,
  JOB_CPU_LIMIT,
  JOB_CPU_REQUEST,
  JOB_MEMORY_LIMIT,
  JOB_MEMORY_REQUEST,
  JOB_POLL_INTERVAL_MS,
  JOB_TIMEOUT_SECONDS,
  JOB_TTL_AFTER_FINISHED_SECONDS,
  K8S_NAMESPACE,
  L2_NETWORK_ID,
  MAX_CONCURRENT_JOBS,
  READER_POD_IMAGE,
} from "../../environment.js";
import { publishMessage } from "../message-bus/index.js";

// --- Types ---

type JobState = {
  jobId: string;
  k8sJobName: string;
  contractClassId: string;
  version: number;
  githubUrl: string;
  gitRef?: string;
  subPath?: string;
  aztecVersion: string;
  compilerImage: string;
  createdAt: Date;
};

type JobLogs = {
  compileLog?: string;
  readerLog?: string;
};

// --- K8s client ---

let batchApi: k8s.BatchV1Api;
let coreApi: k8s.CoreV1Api;

const initK8sClient = () => {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  batchApi = kc.makeApiClient(k8s.BatchV1Api);
  coreApi = kc.makeApiClient(k8s.CoreV1Api);
};

// --- In-memory state ---

const activeJobs = new Map<string, JobState>();

const LABEL_APP = "source-compiler";
const LABEL_JOB_ID = "chicmoz-job-id";
const LABEL_NETWORK_ID = "chicmoz-l2-network";
const ANNOTATION_CONTRACT_CLASS_ID = "chicmoz/contract-class-id";
const ANNOTATION_VERSION = "chicmoz/version";
const ANNOTATION_GITHUB_URL = "chicmoz/github-url";
const ANNOTATION_AZTEC_VERSION = "chicmoz/aztec-version";
const ANNOTATION_COMPILER_IMAGE = "chicmoz/compiler-image";
const NETWORK_LABEL_VALUE = L2_NETWORK_ID.toLowerCase();
const MAX_COMPILE_OUTPUT_CHARS = 16 * 1024;
const GIT_COMMAND_TIMEOUT_MS = 30_000;
const execFileAsync = promisify(execFile);

// --- Helpers ---

const sanitizeForK8s = (id: string): string => {
  // K8s names must be lowercase, alphanumeric, '-', max 63 chars
  return id
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 40);
};

type ResolveCompileInputsError = Error & {
  failureStage: SourceVerificationFailureStage;
  aztecVersion?: string;
};

const createResolveCompileInputsError = (
  failureStage: SourceVerificationFailureStage,
  message: string,
  aztecVersion?: string,
): ResolveCompileInputsError => {
  return Object.assign(new Error(message), {
    failureStage,
    aztecVersion,
  });
};

const jobName = (jobId: string): string => `compile-${sanitizeForK8s(jobId)}`;

/**
 * Validate that a git ref (branch, tag, commit hash) is safe.
 * Allows alphanumeric, '.', '-', '_', '/' (for branch names like feature/foo).
 */
const isValidGitRef = (ref: string): boolean =>
  /^[\w.\-/]+$/.test(ref) && !ref.includes("..") && !ref.startsWith("-");

/**
 * Validate that a sub-path within a repository is safe.
 * Allows alphanumeric, '.', '-', '_', '/' (no '..' to prevent traversal).
 */
const isValidSubPath = (path: string): boolean =>
  /^[\w.\-/]+$/.test(path) && !path.includes("..");

const trimCompileOutput = (output?: string): string | undefined => {
  const normalizedOutput = output?.trim();
  if (!normalizedOutput) {
    return undefined;
  }

  if (normalizedOutput.length <= MAX_COMPILE_OUTPUT_CHARS) {
    return normalizedOutput;
  }

  return `[truncated to last ${MAX_COMPILE_OUTPUT_CHARS} chars]\n${normalizedOutput.slice(-MAX_COMPILE_OUTPUT_CHARS)}`;
};

const getLastStageMarker = (compileLog?: string): string | undefined => {
  if (!compileLog) {
    return undefined;
  }

  const matches = Array.from(compileLog.matchAll(/===STAGE:([A-Z_]+)===/g));

  return matches.length > 0 ? matches[matches.length - 1]?.[1] : undefined;
};

const detectFailureStage = ({
  reason,
  compileLog,
  readerLog,
  podStatusOutput,
  fallbackStage,
}: {
  reason?: string;
  compileLog?: string;
  readerLog?: string;
  podStatusOutput?: string;
  fallbackStage?: SourceVerificationFailureStage;
}): SourceVerificationFailureStage => {
  const combinedOutput = [compileLog, readerLog, podStatusOutput, reason]
    .filter(Boolean)
    .join("\n");

  if (reason === "timeout") {
    return "TIMEOUT";
  }

  if (
    /ErrImagePull|ImagePullBackOff|InvalidImageName|Back-off pulling image|Failed to pull image|pull access denied|manifest unknown|no such image|failed to resolve reference/i.test(
      combinedOutput,
    )
  ) {
    return "IMAGE_RESOLUTION";
  }

  if (/Invalid git ref|Invalid sub-path/i.test(combinedOutput)) {
    return "INPUT_VALIDATION";
  }

  if (
    /Selected artifact is not transpiled|Compiled artifact is still not transpiled|Transpiler doesn't know how to process|thread '\s*<unnamed>' panicked at .*transpile/i.test(
      combinedOutput,
    )
  ) {
    return "TRANSPILATION";
  }

  if (
    /No compiled artifact found after compile|No compiled artifact found after workspace compile|NO_ARTIFACT_FOUND|Could not parse artifact from job pod logs/i.test(
      combinedOutput,
    )
  ) {
    return "ARTIFACT_DISCOVERY";
  }

  if (
    /pathspec|reference is not a tree|did not match any file\(s\) known to git|can't cd to/i.test(
      combinedOutput,
    )
  ) {
    return "CHECKOUT";
  }

  if (
    /fatal: repository|repository .* not found|Could not resolve host|unable to access|Authentication failed/i.test(
      combinedOutput,
    )
  ) {
    return "CLONE";
  }

  const stageMarker = getLastStageMarker(compileLog);
  if (stageMarker === "CLONE") {
    return "CLONE";
  }
  if (stageMarker === "CHECKOUT") {
    return "CHECKOUT";
  }
  if (stageMarker === "ARTIFACT_DISCOVERY") {
    return "ARTIFACT_DISCOVERY";
  }
  if (stageMarker === "SOURCE_EXTRACTION") {
    return "SOURCE_EXTRACTION";
  }
  if (stageMarker === "COMPILE") {
    return "COMPILE";
  }

  if (
    /Compiling contract|Running compile command|bb exited with code|nargo|compile/i.test(
      combinedOutput,
    )
  ) {
    return "COMPILE";
  }

  return fallbackStage ?? "INTERNAL";
};

const summarizeFailure = (
  failureStage: SourceVerificationFailureStage,
): string => {
  switch (failureStage) {
    case "INPUT_VALIDATION":
      return "Compilation request validation failed";
    case "NARGO_DISCOVERY":
      return "Nargo.toml discovery failed";
    case "IMAGE_RESOLUTION":
      return "Compiler image resolution failed";
    case "CLONE":
      return "Repository clone failed";
    case "CHECKOUT":
      return "Repository checkout failed";
    case "COMPILE":
      return "Compilation failed";
    case "TRANSPILATION":
      return "Compilation failed during transpilation";
    case "ARTIFACT_DISCOVERY":
      return "Compiled artifact could not be found";
    case "ARTIFACT_VERIFICATION":
      return "Artifact verification failed";
    case "SOURCE_EXTRACTION":
      return "Compiled source extraction failed";
    case "TIMEOUT":
      return "Compilation job timed out";
    case "INTERNAL":
      return "Internal compilation error";
  }

  return "Internal compilation error";
};

const buildCompilerImage = (aztecVersion: string): string => {
  const normalizedAztecVersion = aztecVersion.replace(/^v/, "");
  const lastColonIndex = COMPILER_IMAGE.lastIndexOf(":");
  const slashIndex = COMPILER_IMAGE.lastIndexOf("/");

  if (lastColonIndex > slashIndex) {
    return `${COMPILER_IMAGE.slice(0, lastColonIndex)}:${normalizedAztecVersion}`;
  }

  return `${COMPILER_IMAGE}:${normalizedAztecVersion}`;
};

const extractAztecVersionFromNargoToml = (
  contents: string,
): string | undefined => {
  const dependenciesSection = contents.match(
    /^\[dependencies\]\s*([\s\S]*?)(?=^\[|$)/m,
  )?.[1];

  const inlineTag = dependenciesSection
    ?.match(
      /^\s*aztec\s*=\s*\{[\s\S]*?\btag\s*=\s*"([^"]+)"[\s\S]*?\}\s*$/m,
    )?.[1]
    ?.trim();
  if (inlineTag) {
    return inlineTag;
  }

  const aztecSection = contents.match(
    /^\[dependencies\.aztec\]\s*([\s\S]*?)(?=^\[|$)/m,
  )?.[1];

  return aztecSection?.match(/^\s*tag\s*=\s*"([^"]+)"/m)?.[1]?.trim();
};

const runGit = async (
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> => {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
      timeout: GIT_COMMAND_TIMEOUT_MS,
    });

    return {
      stdout: stdout.toString(),
      stderr: stderr.toString(),
    };
  } catch (error) {
    const execError = error as NodeJS.ErrnoException & {
      killed?: boolean;
      signal?: NodeJS.Signals;
    };

    if (
      execError.killed === true ||
      execError.signal === "SIGTERM" ||
      execError.message.includes("timed out")
    ) {
      throw createResolveCompileInputsError(
        "TIMEOUT",
        `Git command timed out after ${GIT_COMMAND_TIMEOUT_MS}ms: git ${args.join(" ")}`,
      );
    }

    throw error;
  }
};

const resolveCompileInputs = async (
  event: CompileSourceRequestEvent,
): Promise<{ aztecVersion: string; compilerImage: string }> => {
  if (event.gitRef && !isValidGitRef(event.gitRef)) {
    throw createResolveCompileInputsError(
      "INPUT_VALIDATION",
      `Invalid git ref: ${event.gitRef}`,
    );
  }

  if (event.subPath && !isValidSubPath(event.subPath)) {
    throw createResolveCompileInputsError(
      "INPUT_VALIDATION",
      `Invalid sub-path: ${event.subPath}`,
    );
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "source-verify-"));

  try {
    try {
      await runGit(["clone", "--depth", "1", event.githubUrl, tempDir]);
    } catch (error) {
      throw createResolveCompileInputsError(
        "CLONE",
        `Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (event.gitRef) {
      try {
        await runGit(
          ["fetch", "--depth", "1", "origin", "--", event.gitRef],
          tempDir,
        );
        await runGit(["checkout", "--detach", "FETCH_HEAD"], tempDir);
      } catch (error) {
        throw createResolveCompileInputsError(
          "CHECKOUT",
          `Failed to checkout git ref ${event.gitRef}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const repoPath = (() => {
      if (!event.subPath) {
        return tempDir;
      }

      if (
        event.subPath.startsWith("/") ||
        event.subPath.startsWith("\\") ||
        path.isAbsolute(event.subPath)
      ) {
        throw createResolveCompileInputsError(
          "CHECKOUT",
          `Could not enter sub-path: ${event.subPath}`,
        );
      }

      const resolvedRepoPath = path.resolve(tempDir, event.subPath);
      const relativeRepoPath = path.relative(tempDir, resolvedRepoPath);

      if (
        relativeRepoPath === ".." ||
        relativeRepoPath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeRepoPath)
      ) {
        throw createResolveCompileInputsError(
          "CHECKOUT",
          `Could not enter sub-path: ${event.subPath}`,
        );
      }

      return resolvedRepoPath;
    })();

    try {
      await stat(repoPath);
    } catch {
      throw createResolveCompileInputsError(
        "CHECKOUT",
        `Could not enter sub-path: ${event.subPath}`,
      );
    }

    const nargoPath = path.join(repoPath, "Nargo.toml");

    let nargoToml: string;
    try {
      nargoToml = await readFile(nargoPath, "utf8");
    } catch {
      throw createResolveCompileInputsError(
        "NARGO_DISCOVERY",
        `Could not find readable Nargo.toml at ${event.subPath ? `${event.subPath}/Nargo.toml` : "Nargo.toml"}`,
      );
    }

    const aztecVersion = extractAztecVersionFromNargoToml(nargoToml);
    if (!aztecVersion) {
      throw createResolveCompileInputsError(
        "NARGO_DISCOVERY",
        `Could not determine dependencies.aztec.tag from ${event.subPath ? `${event.subPath}/Nargo.toml` : "Nargo.toml"}`,
      );
    }

    const compilerImage = buildCompilerImage(aztecVersion);

    return { aztecVersion, compilerImage };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

// --- K8s Job creation ---

const buildCompileScript = (
  _githubUrl: string,
  _gitRef?: string,
  _subPath?: string,
): string => {
  // Arguments are passed via env vars (GIT_URL, GIT_REF, SUB_PATH) to avoid
  // shell injection — this script only references those env vars, never
  // interpolated user input.
  const checkoutRef = _gitRef
    ? `git checkout "$GIT_REF"`
    : "echo 'Using default branch'";
  const cdSubPath = _subPath
    ? `cd "/workspace/repo/$SUB_PATH"`
    : "cd /workspace/repo";

  return [
    `set -e`,
    `export RUST_BACKTRACE="\${RUST_BACKTRACE:-1}"`,
    `echo "===INPUTS_START==="`,
    `echo "GIT_URL=${_githubUrl}"`,
    `echo "GIT_REF=${_gitRef ?? ""}"`,
    `echo "SUB_PATH=${_subPath ?? ""}"`,
    `echo "AZTEC_VERSION=$AZTEC_VERSION"`,
    `echo "NARGO_HOME=$NARGO_HOME"`,
    `echo "RUST_BACKTRACE=$RUST_BACKTRACE"`,
    `echo "===INPUTS_END==="`,
    `echo "===STAGE:CLONE==="`,
    `echo "Cloning repository..."`,
    `git clone "$GIT_URL" /workspace/repo`,
    `cd /workspace/repo`,
    `echo "===STAGE:CHECKOUT==="`,
    `echo "Checking out git ref: ${_gitRef ?? "(default branch)"}"`,
    checkoutRef,
    `echo "Resolved HEAD: $(git rev-parse HEAD)"`,
    `git rev-parse HEAD > /output/commit_hash`,
    cdSubPath,
    `echo "===STAGE:COMPILE==="`,
    `echo "Compile working directory: $PWD"`,
    `echo "Detected package name before compile: $(awk -F'"' '/^name[[:space:]]*=[[:space:]]*"/ { print $2; exit }' Nargo.toml 2>/dev/null || true)"`,
    `echo "Compiling contract..."`,
    `ARTIFACT_MARKER_FILE="$(mktemp)"`,
    `touch "$ARTIFACT_MARKER_FILE"`,
    `echo "Running compile command: node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile"`,
    `node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile`,
    `echo "===STAGE:ARTIFACT_DISCOVERY==="`,
    `echo "Discovering compiled artifact..."`,
    `mkdir -p /output/artifact`,
    `CONTRACT_DIR_NAME="$(basename "$PWD")"`,
    `echo "Contract directory name: $CONTRACT_DIR_NAME"`,
    `ARTIFACT_PATHS="$(find /workspace/repo -type f -path "*/target/*.json" -newer "$ARTIFACT_MARKER_FILE" | sort)"`,
    `printf "%s\\n" "$ARTIFACT_PATHS" | sed '/^$/d' > /tmp/artifact-paths.txt`,
    `if [ ! -s /tmp/artifact-paths.txt ]; then echo "No compiled artifact found after compile (searched: /workspace/repo/**/target/*.json newer than marker)"; exit 1; fi`,
    `echo "Discovered artifact paths:"`,
    `cat /tmp/artifact-paths.txt`,
    `SELECTED_ARTIFACT_PATH="$(grep "/target/$CONTRACT_DIR_NAME" /tmp/artifact-paths.txt | head -n 1 || true)"`,
    `if [ -z "$SELECTED_ARTIFACT_PATH" ]; then SELECTED_ARTIFACT_PATH="$(head -n 1 /tmp/artifact-paths.txt)"; fi`,
    `echo "Selected artifact path after first pass: $SELECTED_ARTIFACT_PATH"`,
    `echo "Selected artifact transpiled flag after first pass: $(jq -r '.transpiled // "missing"' "$SELECTED_ARTIFACT_PATH" 2>/dev/null || echo "unreadable")"`,
    `if ! jq -e '.transpiled == true' "$SELECTED_ARTIFACT_PATH" >/dev/null 2>&1; then echo "Selected artifact is not transpiled: $SELECTED_ARTIFACT_PATH"; PACKAGE_NAME="$(awk -F'"' '/^name[[:space:]]*=[[:space:]]*"/ { print $2; exit }' Nargo.toml 2>/dev/null || true)"; WORKSPACE_ROOT=""; SEARCH_DIR="$PWD"; while [ "$SEARCH_DIR" != "/" ]; do if [ -f "$SEARCH_DIR/Nargo.toml" ] && grep -q '^\\[workspace\\]' "$SEARCH_DIR/Nargo.toml"; then WORKSPACE_ROOT="$SEARCH_DIR"; break; fi; if [ "$SEARCH_DIR" = "/workspace/repo" ]; then break; fi; SEARCH_DIR="$(dirname "$SEARCH_DIR")"; done; echo "Workspace root candidate: \${WORKSPACE_ROOT:-"(none)"}"; echo "Package name candidate: \${PACKAGE_NAME:-"(none)"}"; if [ -n "$PACKAGE_NAME" ] && [ -n "$WORKSPACE_ROOT" ]; then echo "Running fallback compile command: node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile --package $PACKAGE_NAME"; echo "Recompiling from workspace root ($WORKSPACE_ROOT) with --package $PACKAGE_NAME to force postprocessing..."; cd "$WORKSPACE_ROOT"; node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile --package "$PACKAGE_NAME"; ARTIFACT_PATHS="$(find /workspace/repo -type f -path "*/target/*.json" -newer "$ARTIFACT_MARKER_FILE" | sort)"; printf "%s\\n" "$ARTIFACT_PATHS" | sed '/^$/d' > /tmp/artifact-paths.txt; if [ ! -s /tmp/artifact-paths.txt ]; then echo "No compiled artifact found after workspace compile"; exit 1; fi; echo "Discovered artifact paths after fallback compile:"; cat /tmp/artifact-paths.txt; SELECTED_ARTIFACT_PATH="$(grep "/target/$CONTRACT_DIR_NAME" /tmp/artifact-paths.txt | head -n 1 || true)"; if [ -z "$SELECTED_ARTIFACT_PATH" ]; then SELECTED_ARTIFACT_PATH="$(head -n 1 /tmp/artifact-paths.txt)"; fi; echo "Selected artifact path after fallback compile: $SELECTED_ARTIFACT_PATH"; echo "Selected artifact transpiled flag after fallback compile: $(jq -r '.transpiled // "missing"' "$SELECTED_ARTIFACT_PATH" 2>/dev/null || echo "unreadable")"; else echo "Skipping fallback compile because package name or workspace root could not be determined"; fi; fi`,
    `if ! jq -e '.transpiled == true' "$SELECTED_ARTIFACT_PATH" >/dev/null 2>&1; then echo "Compiled artifact is still not transpiled: $SELECTED_ARTIFACT_PATH"; exit 1; fi`,
    `cp "$SELECTED_ARTIFACT_PATH" /output/artifact/`,
    `rm -f "$ARTIFACT_MARKER_FILE"`,
    `echo "===STAGE:SOURCE_EXTRACTION==="`,
    `echo "Copying source files (excluding .git)..."`,
    `mkdir -p /output/source`,
    `find . -not -path './.git/*' -not -name '.git' | cpio -pdm /output/source/ 2>/dev/null || cp -r . /output/source/ && rm -rf /output/source/.git`,
    `echo "Done."`,
  ].join(" && ");
};

const buildReaderScript = (): string => {
  return `set -e
echo "===COMMIT_HASH_START==="
cat /output/commit_hash 2>/dev/null || echo ""
echo "===COMMIT_HASH_END==="
ARTIFACT_FILE=$(find /output/artifact -name "*.json" -type f | sort | head -n 1)
if [ -z "$ARTIFACT_FILE" ]; then echo "NO_ARTIFACT_FOUND"; exit 1; fi
echo "===ARTIFACT_START==="
cat "$ARTIFACT_FILE"
echo ""
echo "===ARTIFACT_END==="
echo "===SOURCES_START==="
cd /output/source
find . -type f \\( -name "*.nr" -o -name "Nargo.toml" \\) | sort | while read f; do
  clean_path=$(echo "$f" | sed 's|^\\./||')
  content=$(cat "$f" | sed 's/\\\\/\\\\\\\\/g' | sed 's/"/\\\\"/g' | sed ':a;N;$!ba;s/\\n/\\\\n/g')
  echo "{\\"path\\":\\"$clean_path\\",\\"content\\":\\"$content\\"}"
done
echo "===SOURCES_END==="
`;
};

const createCompileJob = async (state: JobState): Promise<void> => {
  logger.info(
    `Creating compile job: jobId=${state.jobId} k8sJobName=${state.k8sJobName} contractClassId=${state.contractClassId} version=${state.version} githubUrl=${state.githubUrl} gitRef=${state.gitRef ?? "(default branch)"} subPath=${state.subPath ?? "(repo root)"} aztecVersion=${state.aztecVersion} compilerImage=${state.compilerImage} readerImage=${READER_POD_IMAGE} namespace=${K8S_NAMESPACE}`,
  );

  const compileScript = buildCompileScript(
    state.githubUrl,
    state.gitRef,
    state.subPath,
  );
  const readerScript = buildReaderScript();

  const job: k8s.V1Job = {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: state.k8sJobName,
      namespace: K8S_NAMESPACE,
      labels: {
        app: LABEL_APP,
        [LABEL_JOB_ID]: state.jobId,
        [LABEL_NETWORK_ID]: NETWORK_LABEL_VALUE,
      },
      annotations: {
        [ANNOTATION_CONTRACT_CLASS_ID]: state.contractClassId,
        [ANNOTATION_VERSION]: String(state.version),
        [ANNOTATION_GITHUB_URL]: state.githubUrl,
        [ANNOTATION_AZTEC_VERSION]: state.aztecVersion,
        [ANNOTATION_COMPILER_IMAGE]: state.compilerImage,
      },
    },
    spec: {
      backoffLimit: 0,
      activeDeadlineSeconds: JOB_TIMEOUT_SECONDS,
      ttlSecondsAfterFinished: JOB_TTL_AFTER_FINISHED_SECONDS,
      template: {
        metadata: {
          labels: {
            app: LABEL_APP,
            [LABEL_JOB_ID]: state.jobId,
            [LABEL_NETWORK_ID]: NETWORK_LABEL_VALUE,
          },
        },
        spec: {
          ...(IMAGE_PULL_SECRET
            ? { imagePullSecrets: [{ name: IMAGE_PULL_SECRET }] }
            : {}),
          restartPolicy: "Never",
          automountServiceAccountToken: false,
          initContainers: [
            {
              name: "compiler",
              image: state.compilerImage,
              command: ["/bin/sh", "-c"],
              args: [compileScript],
              env: [
                {
                  name: "NARGO_HOME",
                  value: "/root/nargo",
                },
                {
                  name: "GIT_URL",
                  value: state.githubUrl,
                },
                {
                  name: "AZTEC_VERSION",
                  value: state.aztecVersion,
                },
                ...(state.gitRef
                  ? [{ name: "GIT_REF", value: state.gitRef }]
                  : []),
                ...(state.subPath
                  ? [{ name: "SUB_PATH", value: state.subPath }]
                  : []),
              ],
              volumeMounts: [
                {
                  name: "output",
                  mountPath: "/output",
                },
              ],
              resources: {
                requests: {
                  cpu: JOB_CPU_REQUEST,
                  memory: JOB_MEMORY_REQUEST,
                },
                limits: {
                  cpu: JOB_CPU_LIMIT,
                  memory: JOB_MEMORY_LIMIT,
                },
              },
            },
          ],
          containers: [
            {
              name: "reader",
              image: READER_POD_IMAGE,
              command: ["/bin/sh", "-c"],
              args: [readerScript],
              volumeMounts: [
                {
                  name: "output",
                  mountPath: "/output",
                  readOnly: true,
                },
              ],
            },
          ],
          volumes: [
            {
              name: "output",
              emptyDir: {
                sizeLimit: EMPTYDIR_SIZE_LIMIT,
              },
            },
          ],
        },
      },
    },
  };

  await batchApi.createNamespacedJob({
    namespace: K8S_NAMESPACE,
    body: job,
  });
  logger.info(`Created K8s Job: ${state.k8sJobName}`);
};

// --- Read results from Job pod logs ---

const getJobPodName = async (state: JobState): Promise<string> => {
  const pods = await coreApi.listNamespacedPod({
    namespace: K8S_NAMESPACE,
    labelSelector: `${LABEL_JOB_ID}=${state.jobId}`,
  });

  const podName = pods.items[0]?.metadata?.name;
  if (!podName) {
    throw new Error(
      `No pod found for job ${state.k8sJobName} (jobId=${state.jobId})`,
    );
  }

  return podName;
};

const readPodContainerLog = async ({
  podName,
  container,
}: {
  podName: string;
  container: string;
}): Promise<string | undefined> => {
  try {
    const logs = await coreApi.readNamespacedPodLog({
      name: podName,
      namespace: K8S_NAMESPACE,
      container,
    });

    return typeof logs === "string" ? logs : String(logs);
  } catch (error) {
    logger.warn(
      `Failed to read ${container} logs for pod ${podName}: ${(error as Error).message}`,
    );
    return undefined;
  }
};

const readJobLogs = async (state: JobState): Promise<JobLogs> => {
  try {
    const podName = await getJobPodName(state);

    const [compileLog, readerLog] = await Promise.all([
      readPodContainerLog({ podName, container: "compiler" }),
      readPodContainerLog({ podName, container: "reader" }),
    ]);

    return { compileLog, readerLog };
  } catch (error) {
    logger.warn(
      `Failed to read job logs for jobId=${state.jobId}: ${(error as Error).message}`,
    );
    return {};
  }
};

const getPodFailureDiagnostics = async (
  state: JobState,
): Promise<string | undefined> => {
  try {
    const podName = await getJobPodName(state);
    const pod = await coreApi.readNamespacedPod({
      name: podName,
      namespace: K8S_NAMESPACE,
    });

    const statusMessages = [
      ...(pod.status?.initContainerStatuses ?? []),
      ...(pod.status?.containerStatuses ?? []),
    ].flatMap((containerStatus) =>
      [
        containerStatus.state?.waiting?.reason,
        containerStatus.state?.waiting?.message,
        containerStatus.state?.terminated?.reason,
        containerStatus.state?.terminated?.message,
        containerStatus.lastState?.terminated?.reason,
        containerStatus.lastState?.terminated?.message,
      ].filter(Boolean),
    );

    const conditionMessages = (pod.status?.conditions ?? []).flatMap(
      (condition) => [condition.reason, condition.message].filter(Boolean),
    );

    const diagnostics = [...statusMessages, ...conditionMessages]
      .join("\n")
      .trim();
    return diagnostics || undefined;
  } catch (error) {
    logger.warn(
      `Failed to read pod diagnostics for jobId=${state.jobId}: ${(error as Error).message}`,
    );
    return undefined;
  }
};

const buildCompileOutput = ({
  compileLog,
  readerLog,
  podStatusOutput,
}: JobLogs & { podStatusOutput?: string }): string | undefined => {
  const sections = [
    compileLog ? `=== compiler log ===\n${compileLog.trim()}` : undefined,
    readerLog ? `=== reader log ===\n${readerLog.trim()}` : undefined,
    podStatusOutput
      ? `=== pod status ===\n${podStatusOutput.trim()}`
      : undefined,
  ].filter(Boolean);

  return trimCompileOutput(sections.join("\n\n"));
};

const readResultsFromJobPod = async (
  state: JobState,
): Promise<{
  artifactJson: string;
  sourceFiles: Array<{ path: string; content: string }>;
  commitHash?: string;
}> => {
  const podName = await getJobPodName(state);

  // Read logs from the reader (main) container
  const logStr =
    (await readPodContainerLog({ podName, container: "reader" })) ?? "";

  // Parse commit hash
  const commitHashMatch = logStr.match(
    /===COMMIT_HASH_START===\n([\s\S]*?)\n===COMMIT_HASH_END===/,
  );
  const commitHash = commitHashMatch ? commitHashMatch[1].trim() : undefined;

  // Parse artifact
  const artifactMatch = logStr.match(
    /===ARTIFACT_START===\n([\s\S]*?)\n===ARTIFACT_END===/,
  );
  if (!artifactMatch) {
    throw new Error("Could not parse artifact from job pod logs");
  }
  const artifactJson = artifactMatch[1].trim();

  // Parse source files
  const sourcesMatch = logStr.match(
    /===SOURCES_START===\n([\s\S]*?)\n===SOURCES_END===/,
  );
  const sourceFiles: Array<{ path: string; content: string }> = [];
  if (sourcesMatch) {
    const lines = sourcesMatch[1].trim().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as { path: string; content: string };
        sourceFiles.push(parsed);
      } catch {
        logger.warn(`Failed to parse source file line: ${line}`);
      }
    }
  }

  return { artifactJson, sourceFiles, commitHash };
};

// --- Job status polling ---

const checkJobStatus = async (
  state: JobState,
): Promise<"running" | "succeeded" | "failed"> => {
  try {
    const job = await batchApi.readNamespacedJob({
      name: state.k8sJobName,
      namespace: K8S_NAMESPACE,
    });

    const conditions = job.status?.conditions ?? [];
    for (const cond of conditions) {
      if (cond.type === "Complete" && cond.status === "True") {
        return "succeeded";
      }
      if (cond.type === "Failed" && cond.status === "True") {
        return "failed";
      }
    }
    return "running";
  } catch (e) {
    logger.error(
      `Error checking job status for ${state.k8sJobName}: ${(e as Error).message}`,
    );
    return "failed";
  }
};

const getJobFailureReason = async (state: JobState): Promise<string> => {
  try {
    try {
      const podName = await getJobPodName(state);
      const pod = await coreApi.readNamespacedPod({
        name: podName,
        namespace: K8S_NAMESPACE,
      });

      for (const containerStatus of pod.status?.initContainerStatuses ?? []) {
        const waiting = containerStatus.state?.waiting;
        if (waiting) {
          return `${waiting.reason ?? "waiting"}: ${waiting.message ?? ""}`.trim();
        }
      }

      for (const containerStatus of pod.status?.containerStatuses ?? []) {
        const waiting = containerStatus.state?.waiting;
        if (waiting) {
          return `${waiting.reason ?? "waiting"}: ${waiting.message ?? ""}`.trim();
        }
      }
    } catch {
      // Fall back to job conditions below.
    }

    const job = await batchApi.readNamespacedJob({
      name: state.k8sJobName,
      namespace: K8S_NAMESPACE,
    });

    const conditions = job.status?.conditions ?? [];
    for (const cond of conditions) {
      if (cond.type === "Failed" && cond.status === "True") {
        if (cond.reason === "DeadlineExceeded") {
          return "timeout";
        }
        return cond.message ?? cond.reason ?? "unknown failure";
      }
    }
    return "unknown failure";
  } catch {
    return "unable to read job status";
  }
};

const handleJobCompletion = async (state: JobState): Promise<void> => {
  // Remove from active jobs immediately to prevent duplicate handling on next poll
  activeJobs.delete(state.jobId);
  logger.info(`Job completed successfully: ${state.k8sJobName}`);

  try {
    const { artifactJson, sourceFiles, commitHash } =
      await readResultsFromJobPod(state);

    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: state.jobId,
      contractClassId: state.contractClassId,
      version: state.version,
      status: "success",
      aztecVersion: state.aztecVersion,
      artifactJson,
      sourceFiles,
      commitHash,
    });

    logger.info(`Published success result for jobId=${state.jobId}`);
  } catch (e) {
    logger.error(
      `Failed to read artifact for jobId=${state.jobId}: ${(e as Error).message}`,
    );

    const logs = await readJobLogs(state);
    const failureStage = detectFailureStage({
      compileLog: logs.compileLog,
      readerLog: logs.readerLog,
      fallbackStage: "SOURCE_EXTRACTION",
    });

    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: state.jobId,
        contractClassId: state.contractClassId,
        version: state.version,
        status: "compilation_failed",
        aztecVersion: state.aztecVersion,
        error: summarizeFailure(failureStage),
        failureStage,
        compileOutput: buildCompileOutput(logs),
      });
    } catch (publishError) {
      logger.error(
        `Failed to publish failure result for jobId=${state.jobId}: ${(publishError as Error).message}`,
      );
    }
  }
};

const handleJobFailure = async (state: JobState): Promise<void> => {
  // Remove from active jobs immediately to prevent duplicate handling on next poll
  activeJobs.delete(state.jobId);
  const reason = await getJobFailureReason(state);
  const logs = await readJobLogs(state);
  const podStatusOutput = await getPodFailureDiagnostics(state);
  const failureStage = detectFailureStage({
    reason,
    compileLog: logs.compileLog,
    readerLog: logs.readerLog,
    podStatusOutput,
  });
  const status =
    failureStage === "TIMEOUT"
      ? ("timeout" as const)
      : failureStage === "CLONE"
        ? ("clone_failed" as const)
        : ("compilation_failed" as const);

  logger.warn(`Job failed: ${state.k8sJobName}, reason: ${reason}`);

  try {
    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: state.jobId,
      contractClassId: state.contractClassId,
      version: state.version,
      status,
      aztecVersion: state.aztecVersion,
      error: summarizeFailure(failureStage),
      failureStage,
      compileOutput: buildCompileOutput({ ...logs, podStatusOutput }),
    });
  } catch (e) {
    logger.error(
      `Failed to publish failure result for jobId=${state.jobId}: ${(e as Error).message}`,
    );
  }
};

// --- Poll loop ---

let pollIntervalHandle: ReturnType<typeof setInterval> | null = null;

const pollActiveJobs = async (): Promise<void> => {
  const jobs = Array.from(activeJobs.values());

  for (const state of jobs) {
    const status = await checkJobStatus(state);

    if (status === "succeeded") {
      await handleJobCompletion(state);
    } else if (status === "failed") {
      await handleJobFailure(state);
    }
    // "running" -> do nothing, check again next poll
  }
};

export const startJobPoller = (): void => {
  if (pollIntervalHandle) {
    return;
  }
  pollIntervalHandle = setInterval(() => {
    pollActiveJobs().catch((e) => {
      logger.error(`Job poll error: ${(e as Error).message}`);
    });
  }, JOB_POLL_INTERVAL_MS);
  logger.info(`Job poller started (interval: ${JOB_POLL_INTERVAL_MS}ms)`);
};

const stopJobPoller = (): void => {
  if (pollIntervalHandle) {
    clearInterval(pollIntervalHandle);
    pollIntervalHandle = null;
  }
};

// --- Public API ---

export const handleCompileRequest = async (
  event: CompileSourceRequestEvent,
): Promise<void> => {
  if (activeJobs.size >= MAX_CONCURRENT_JOBS) {
    logger.warn(
      `Max concurrent jobs (${MAX_CONCURRENT_JOBS}) reached, rejecting jobId=${event.jobId}`,
    );
    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: event.jobId,
        contractClassId: event.contractClassId,
        version: event.version,
        status: "compilation_failed",
        error: summarizeFailure("INTERNAL"),
        failureStage: "INTERNAL",
        compileOutput:
          "Server at maximum compilation capacity. Please try again later.",
      });
    } catch (e) {
      logger.error(
        `Failed to publish rejection for jobId=${event.jobId}: ${(e as Error).message}`,
      );
    }
    return;
  }

  if (event.gitRef && !isValidGitRef(event.gitRef)) {
    logger.warn(`Invalid gitRef for jobId=${event.jobId}: ${event.gitRef}`);
    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: event.jobId,
        contractClassId: event.contractClassId,
        version: event.version,
        status: "compilation_failed",
        error: summarizeFailure("INPUT_VALIDATION"),
        failureStage: "INPUT_VALIDATION",
        compileOutput:
          "Invalid git ref. Only alphanumeric characters, '.', '-', '_', and '/' are allowed.",
      });
    } catch (e) {
      logger.error(
        `Failed to publish rejection for jobId=${event.jobId}: ${(e as Error).message}`,
      );
    }
    return;
  }

  if (event.subPath && !isValidSubPath(event.subPath)) {
    logger.warn(`Invalid subPath for jobId=${event.jobId}: ${event.subPath}`);
    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: event.jobId,
        contractClassId: event.contractClassId,
        version: event.version,
        status: "compilation_failed",
        error: summarizeFailure("INPUT_VALIDATION"),
        failureStage: "INPUT_VALIDATION",
        compileOutput:
          "Invalid sub-path. Only alphanumeric characters, '.', '-', '_', and '/' are allowed (no '..').",
      });
    } catch (e) {
      logger.error(
        `Failed to publish rejection for jobId=${event.jobId}: ${(e as Error).message}`,
      );
    }
    return;
  }

  const jName = jobName(event.jobId);

  let resolvedInputs: { aztecVersion: string; compilerImage: string };

  try {
    resolvedInputs = await resolveCompileInputs(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failureStage =
      (error as Partial<ResolveCompileInputsError>).failureStage ?? "INTERNAL";
    const aztecVersion = (error as Partial<ResolveCompileInputsError>)
      .aztecVersion;

    logger.warn(
      `Failed to resolve compile inputs for jobId=${event.jobId}: ${message}`,
    );

    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: event.jobId,
        contractClassId: event.contractClassId,
        version: event.version,
        status:
          failureStage === "CLONE" ? "clone_failed" : "compilation_failed",
        aztecVersion,
        error: summarizeFailure(failureStage),
        failureStage,
        compileOutput: trimCompileOutput(message),
      });
    } catch (publishError) {
      logger.error(
        `Failed to publish resolution failure for jobId=${event.jobId}: ${(publishError as Error).message}`,
      );
    }
    return;
  }

  logger.info(
    `Resolved compile inputs for jobId=${event.jobId}: aztecVersion=${resolvedInputs.aztecVersion} compilerImage=${resolvedInputs.compilerImage}`,
  );

  const state: JobState = {
    jobId: event.jobId,
    k8sJobName: jName,
    contractClassId: event.contractClassId,
    version: event.version,
    githubUrl: event.githubUrl,
    gitRef: event.gitRef,
    subPath: event.subPath,
    aztecVersion: resolvedInputs.aztecVersion,
    compilerImage: resolvedInputs.compilerImage,
    createdAt: new Date(),
  };

  try {
    await createCompileJob(state);
    activeJobs.set(event.jobId, state);
    logger.info(`Started compile job: jobId=${event.jobId} k8sJob=${jName}`);
  } catch (e) {
    logger.error(
      `Failed to create compile job for jobId=${event.jobId}: ${(e as Error).message}`,
    );

    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: event.jobId,
        contractClassId: event.contractClassId,
        version: event.version,
        status: "compilation_failed",
        aztecVersion: state.aztecVersion,
        error: summarizeFailure("INTERNAL"),
        failureStage: "INTERNAL",
        compileOutput: trimCompileOutput(
          `Failed to create compile job: ${(e as Error).message}`,
        ),
      });
    } catch (publishError) {
      logger.error(
        `Failed to publish failure result for jobId=${event.jobId}: ${(publishError as Error).message}`,
      );
    }
  }
};

// --- Recovery ---

export const recoverActiveJobs = async (): Promise<void> => {
  logger.info("Recovering active compile jobs from K8s...");

  try {
    const jobList = await batchApi.listNamespacedJob({
      namespace: K8S_NAMESPACE,
      labelSelector: `app=${LABEL_APP},${LABEL_NETWORK_ID}=${NETWORK_LABEL_VALUE}`,
    });

    let recovered = 0;
    for (const job of jobList.items) {
      const jobId = job.metadata?.labels?.[LABEL_JOB_ID];
      if (!jobId) {
        continue;
      }

      // Check if the job is still active (no Complete or Failed condition)
      const conditions = job.status?.conditions ?? [];
      const isFinished = conditions.some(
        (c: k8s.V1JobCondition) =>
          (c.type === "Complete" || c.type === "Failed") && c.status === "True",
      );

      if (!isFinished) {
        const annotations = job.metadata?.annotations ?? {};
        const state: JobState = {
          jobId,
          k8sJobName: job.metadata?.name ?? jobName(jobId),
          contractClassId:
            annotations[ANNOTATION_CONTRACT_CLASS_ID] ?? "unknown-recovery",
          version: Number(annotations[ANNOTATION_VERSION]) || 0,
          githubUrl: annotations[ANNOTATION_GITHUB_URL] ?? "unknown-recovery",
          aztecVersion:
            annotations[ANNOTATION_AZTEC_VERSION] ?? "unknown-recovery",
          compilerImage:
            annotations[ANNOTATION_COMPILER_IMAGE] ?? COMPILER_IMAGE,
          createdAt: job.metadata?.creationTimestamp
            ? new Date(job.metadata.creationTimestamp)
            : new Date(),
        };
        activeJobs.set(jobId, state);
        recovered++;
        logger.info(
          `Recovered active job: ${state.k8sJobName} (jobId=${jobId})`,
        );
      }
    }

    logger.info(`Recovery complete. ${recovered} active jobs found.`);
  } catch (e) {
    logger.error(`Failed to recover active jobs: ${(e as Error).message}`);
  }
};

// --- Service lifecycle ---

export const jobManagerService: MicroserviceBaseSvc = {
  svcId: "JOB_MANAGER",
  getConfigStr: () =>
    `K8S_NAMESPACE=${K8S_NAMESPACE} MAX_CONCURRENT=${MAX_CONCURRENT_JOBS} COMPILER_IMAGE=${COMPILER_IMAGE}`,
  init: (): Promise<void> => {
    initK8sClient();
    logger.info("K8s client initialized");
    return Promise.resolve();
  },
  health: () => true,
  shutdown: (): Promise<void> => {
    stopJobPoller();
    logger.info("Job manager shut down");
    return Promise.resolve();
  },
};
