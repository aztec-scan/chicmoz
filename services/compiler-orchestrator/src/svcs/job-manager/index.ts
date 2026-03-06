import * as k8s from "@kubernetes/client-node";
import type { CompileSourceRequestEvent } from "@chicmoz-pkg/message-registry";
import type { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
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
  MAX_CONCURRENT_JOBS,
  READER_POD_IMAGE,
} from "../../environment.js";
import { publishMessage } from "../message-bus/index.js";

// --- Types ---

interface JobState {
  jobId: string;
  k8sJobName: string;
  contractClassId: string;
  version: number;
  githubUrl: string;
  gitRef?: string;
  subPath?: string;
  aztecVersion: string;
  createdAt: Date;
}

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
const ANNOTATION_CONTRACT_CLASS_ID = "chicmoz/contract-class-id";
const ANNOTATION_VERSION = "chicmoz/version";
const ANNOTATION_GITHUB_URL = "chicmoz/github-url";
const ANNOTATION_AZTEC_VERSION = "chicmoz/aztec-version";

// --- Helpers ---

const sanitizeForK8s = (id: string): string => {
  // K8s names must be lowercase, alphanumeric, '-', max 63 chars
  return id
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 40);
};

const jobName = (jobId: string): string => `compile-${sanitizeForK8s(jobId)}`;

/**
 * Validate that a git ref (branch, tag, commit hash) is safe.
 * Allows alphanumeric, '.', '-', '_', '/' (for branch names like feature/foo).
 */
const isValidGitRef = (ref: string): boolean =>
  /^[\w.\-/]+$/.test(ref) && !ref.includes("..");

/**
 * Validate that a sub-path within a repository is safe.
 * Allows alphanumeric, '.', '-', '_', '/' (no '..' to prevent traversal).
 */
const isValidSubPath = (path: string): boolean =>
  /^[\w.\-/]+$/.test(path) && !path.includes("..");

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
    `echo "Cloning repository..."`,
    `git clone "$GIT_URL" /workspace/repo`,
    `cd /workspace/repo`,
    checkoutRef,
    `git rev-parse HEAD > /output/commit_hash`,
    cdSubPath,
    `echo "Compiling contract..."`,
    `ARTIFACT_MARKER_FILE="$(mktemp)"`,
    `touch "$ARTIFACT_MARKER_FILE"`,
    `node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile`,
    `echo "Discovering compiled artifact..."`,
    `mkdir -p /output/artifact`,
    `CONTRACT_DIR_NAME="$(basename "$PWD")"`,
    `ARTIFACT_PATHS="$(find /workspace/repo -type f -path "*/target/*.json" -newer "$ARTIFACT_MARKER_FILE" | sort)"`,
    `printf "%s\\n" "$ARTIFACT_PATHS" | sed '/^$/d' > /tmp/artifact-paths.txt`,
    `if [ ! -s /tmp/artifact-paths.txt ]; then echo "No compiled artifact found after compile (searched: /workspace/repo/**/target/*.json newer than marker)"; exit 1; fi`,
    `echo "Discovered artifact paths:"`,
    `cat /tmp/artifact-paths.txt`,
    `SELECTED_ARTIFACT_PATH="$(grep "/target/$CONTRACT_DIR_NAME" /tmp/artifact-paths.txt | head -n 1 || true)"`,
    `if [ -z "$SELECTED_ARTIFACT_PATH" ]; then SELECTED_ARTIFACT_PATH="$(head -n 1 /tmp/artifact-paths.txt)"; fi`,
    `if ! jq -e '.transpiled == true' "$SELECTED_ARTIFACT_PATH" >/dev/null 2>&1; then echo "Selected artifact is not transpiled: $SELECTED_ARTIFACT_PATH"; PACKAGE_NAME="$(awk -F'"' '/^name[[:space:]]*=[[:space:]]*"/ { print $2; exit }' Nargo.toml 2>/dev/null || true)"; WORKSPACE_ROOT=""; SEARCH_DIR="$PWD"; while [ "$SEARCH_DIR" != "/" ]; do if [ -f "$SEARCH_DIR/Nargo.toml" ] && grep -q '^\\[workspace\\]' "$SEARCH_DIR/Nargo.toml"; then WORKSPACE_ROOT="$SEARCH_DIR"; break; fi; if [ "$SEARCH_DIR" = "/workspace/repo" ]; then break; fi; SEARCH_DIR="$(dirname "$SEARCH_DIR")"; done; if [ -n "$PACKAGE_NAME" ] && [ -n "$WORKSPACE_ROOT" ]; then echo "Recompiling from workspace root ($WORKSPACE_ROOT) with --package $PACKAGE_NAME to force postprocessing..."; cd "$WORKSPACE_ROOT"; node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile --package "$PACKAGE_NAME"; ARTIFACT_PATHS="$(find /workspace/repo -type f -path "*/target/*.json" -newer "$ARTIFACT_MARKER_FILE" | sort)"; printf "%s\\n" "$ARTIFACT_PATHS" | sed '/^$/d' > /tmp/artifact-paths.txt; if [ ! -s /tmp/artifact-paths.txt ]; then echo "No compiled artifact found after workspace compile"; exit 1; fi; SELECTED_ARTIFACT_PATH="$(grep "/target/$CONTRACT_DIR_NAME" /tmp/artifact-paths.txt | head -n 1 || true)"; if [ -z "$SELECTED_ARTIFACT_PATH" ]; then SELECTED_ARTIFACT_PATH="$(head -n 1 /tmp/artifact-paths.txt)"; fi; fi; fi`,
    `if ! jq -e '.transpiled == true' "$SELECTED_ARTIFACT_PATH" >/dev/null 2>&1; then echo "Compiled artifact is still not transpiled: $SELECTED_ARTIFACT_PATH"; exit 1; fi`,
    `cp "$SELECTED_ARTIFACT_PATH" /output/artifact/`,
    `rm -f "$ARTIFACT_MARKER_FILE"`,
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
      },
      annotations: {
        [ANNOTATION_CONTRACT_CLASS_ID]: state.contractClassId,
        [ANNOTATION_VERSION]: String(state.version),
        [ANNOTATION_GITHUB_URL]: state.githubUrl,
        [ANNOTATION_AZTEC_VERSION]: state.aztecVersion,
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
              image: COMPILER_IMAGE,
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

const readResultsFromJobPod = async (
  state: JobState,
): Promise<{
  artifactJson: string;
  sourceFiles: Array<{ path: string; content: string }>;
  commitHash?: string;
}> => {
  // Find the pod created by the Job
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

  // Read logs from the reader (main) container
  const logs = await coreApi.readNamespacedPodLog({
    name: podName,
    namespace: K8S_NAMESPACE,
    container: "reader",
  });

  const logStr = typeof logs === "string" ? logs : String(logs);

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
      artifactJson,
      sourceFiles,
      commitHash,
    });

    logger.info(`Published success result for jobId=${state.jobId}`);
  } catch (e) {
    logger.error(
      `Failed to read artifact for jobId=${state.jobId}: ${(e as Error).message}`,
    );

    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: state.jobId,
        contractClassId: state.contractClassId,
        version: state.version,
        status: "compilation_failed",
        error: `Failed to read compiled artifact: ${(e as Error).message}`,
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
  const status =
    reason === "timeout"
      ? ("timeout" as const)
      : ("compilation_failed" as const);

  logger.warn(`Job failed: ${state.k8sJobName}, reason: ${reason}`);

  try {
    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: state.jobId,
      contractClassId: state.contractClassId,
      version: state.version,
      status,
      error: reason,
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
        error:
          "Server at maximum compilation capacity. Please try again later.",
      });
    } catch (e) {
      logger.error(
        `Failed to publish rejection for jobId=${event.jobId}: ${(e as Error).message}`,
      );
    }
    return;
  }

  // Validate gitRef and subPath to prevent shell injection / path traversal
  if (event.gitRef && !isValidGitRef(event.gitRef)) {
    logger.warn(`Invalid gitRef for jobId=${event.jobId}: ${event.gitRef}`);
    try {
      await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
        jobId: event.jobId,
        contractClassId: event.contractClassId,
        version: event.version,
        status: "compilation_failed",
        error:
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
        error:
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

  const state: JobState = {
    jobId: event.jobId,
    k8sJobName: jName,
    contractClassId: event.contractClassId,
    version: event.version,
    githubUrl: event.githubUrl,
    gitRef: event.gitRef,
    subPath: event.subPath,
    aztecVersion: event.aztecVersion,
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
        error: `Failed to create compile job: ${(e as Error).message}`,
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
      labelSelector: `app=${LABEL_APP}`,
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
