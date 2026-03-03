import * as k8s from "@kubernetes/client-node";
import type { CompileSourceRequestEvent } from "@chicmoz-pkg/message-registry";
import type { MicroserviceBaseSvc } from "@chicmoz-pkg/microservice-base";
import { logger } from "../../logger.js";
import {
  COMPILER_IMAGE,
  JOB_CPU_LIMIT,
  JOB_CPU_REQUEST,
  JOB_MEMORY_LIMIT,
  JOB_MEMORY_REQUEST,
  JOB_POLL_INTERVAL_MS,
  JOB_TIMEOUT_SECONDS,
  JOB_TTL_AFTER_FINISHED_SECONDS,
  K8S_NAMESPACE,
  MAX_CONCURRENT_JOBS,
  PVC_STORAGE_SIZE,
  READER_POD_IMAGE,
} from "../../environment.js";
import { publishMessage } from "../message-bus/index.js";

// --- Types ---

interface JobState {
  jobId: string;
  k8sJobName: string;
  pvcName: string;
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

// --- Helpers ---

const sanitizeForK8s = (id: string): string => {
  // K8s names must be lowercase, alphanumeric, '-', max 63 chars
  return id
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 40);
};

const jobName = (jobId: string): string => `compile-${sanitizeForK8s(jobId)}`;

const pvcName = (jobId: string): string =>
  `compile-out-${sanitizeForK8s(jobId)}`;

const readerPodName = (jobId: string): string =>
  `reader-${sanitizeForK8s(jobId)}`;

// --- PVC management ---

const createPvc = async (name: string): Promise<void> => {
  const pvc: k8s.V1PersistentVolumeClaim = {
    apiVersion: "v1",
    kind: "PersistentVolumeClaim",
    metadata: {
      name,
      namespace: K8S_NAMESPACE,
      labels: {
        app: LABEL_APP,
      },
    },
    spec: {
      accessModes: ["ReadWriteOnce"],
      resources: {
        requests: {
          storage: PVC_STORAGE_SIZE,
        },
      },
    },
  };
  await coreApi.createNamespacedPersistentVolumeClaim({
    namespace: K8S_NAMESPACE,
    body: pvc,
  });
  logger.info(`Created PVC: ${name}`);
};

const deletePvc = async (name: string): Promise<void> => {
  try {
    await coreApi.deleteNamespacedPersistentVolumeClaim({
      name,
      namespace: K8S_NAMESPACE,
    });
    logger.info(`Deleted PVC: ${name}`);
  } catch (e) {
    logger.warn(`Failed to delete PVC ${name}: ${(e as Error).message}`);
  }
};

// --- K8s Job creation ---

const buildCompileScript = (
  githubUrl: string,
  gitRef?: string,
  subPath?: string,
): string => {
  const cloneBranch = gitRef ? `--branch ${gitRef}` : "";
  const cdSubPath = subPath
    ? `cd /workspace/repo/${subPath}`
    : "cd /workspace/repo";

  return [
    `set -e`,
    `echo "Cloning repository..."`,
    `git clone --depth 1 ${cloneBranch} "${githubUrl}" /workspace/repo`,
    cdSubPath,
    `echo "Compiling contract..."`,
    `node --no-warnings /usr/src/yarn-project/aztec/dest/bin/index.js compile`,
    `echo "Copying compiled artifact..."`,
    `mkdir -p /output/artifact`,
    `cp target/*.json /output/artifact/`,
    `echo "Copying source files..."`,
    `mkdir -p /output/source`,
    `cp -r . /output/source/`,
    `echo "Done."`,
  ].join(" && ");
};

const createCompileJob = async (state: JobState): Promise<void> => {
  const script = buildCompileScript(
    state.githubUrl,
    state.gitRef,
    state.subPath,
  );

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
          restartPolicy: "Never",
          automountServiceAccountToken: false,
          containers: [
            {
              name: "compiler",
              image: COMPILER_IMAGE,
              command: ["/bin/sh", "-c"],
              args: [script],
              env: [
                {
                  name: "NARGO_HOME",
                  value: "/root/nargo",
                },
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
          volumes: [
            {
              name: "output",
              persistentVolumeClaim: {
                claimName: state.pvcName,
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

// --- Reader pod ---

const readArtifactFromPvc = async (
  state: JobState,
): Promise<{
  artifactJson: string;
  sourceFiles: Array<{ path: string; content: string }>;
}> => {
  const podName = readerPodName(state.jobId);

  // The reader pod:
  // 1. Reads the artifact JSON from /output/artifact/
  // 2. Reads source files from /output/source/ and outputs them as JSON
  const readerScript = `set -e
ARTIFACT_FILE=$(find /output/artifact -name "*.json" -type f | head -n 1)
if [ -z "$ARTIFACT_FILE" ]; then echo "NO_ARTIFACT_FOUND"; exit 1; fi
echo "===ARTIFACT_START==="
cat "$ARTIFACT_FILE"
echo ""
echo "===ARTIFACT_END==="
echo "===SOURCES_START==="
cd /output/source
find . -type f \\( -name "*.nr" -o -name "Nargo.toml" \\) | sort | while read f; do
  content=$(cat "$f" | sed 's/\\\\/\\\\\\\\/g' | sed 's/"/\\\\"/g' | sed ':a;N;$!ba;s/\\n/\\\\n/g')
  echo "{\\"path\\":\\"$f\\",\\"content\\":\\"$content\\"}"
done
echo "===SOURCES_END==="
`;

  const pod: k8s.V1Pod = {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: podName,
      namespace: K8S_NAMESPACE,
      labels: {
        app: LABEL_APP,
        [LABEL_JOB_ID]: state.jobId,
        role: "reader",
      },
    },
    spec: {
      restartPolicy: "Never",
      automountServiceAccountToken: false,
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
          persistentVolumeClaim: {
            claimName: state.pvcName,
          },
        },
      ],
    },
  };

  // Create reader pod
  await coreApi.createNamespacedPod({
    namespace: K8S_NAMESPACE,
    body: pod,
  });
  logger.info(`Created reader pod: ${podName}`);

  // Wait for reader pod to complete
  const maxWaitMs = 60_000;
  const pollMs = 2_000;
  let elapsed = 0;

  while (elapsed < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    elapsed += pollMs;

    const podStatus = await coreApi.readNamespacedPod({
      name: podName,
      namespace: K8S_NAMESPACE,
    });
    const phase = podStatus.status?.phase;

    if (phase === "Succeeded") {
      break;
    }
    if (phase === "Failed") {
      throw new Error("Reader pod failed");
    }
  }

  if (elapsed >= maxWaitMs) {
    throw new Error("Reader pod timed out");
  }

  // Read logs from reader pod
  const logs = await coreApi.readNamespacedPodLog({
    name: podName,
    namespace: K8S_NAMESPACE,
    container: "reader",
  });

  const logStr = typeof logs === "string" ? logs : String(logs);

  // Parse artifact
  const artifactMatch = logStr.match(
    /===ARTIFACT_START===\n([\s\S]*?)\n===ARTIFACT_END===/,
  );
  if (!artifactMatch) {
    throw new Error("Could not parse artifact from reader pod logs");
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

  // Cleanup reader pod
  try {
    await coreApi.deleteNamespacedPod({
      name: podName,
      namespace: K8S_NAMESPACE,
    });
    logger.info(`Deleted reader pod: ${podName}`);
  } catch (e) {
    logger.warn(
      `Failed to delete reader pod ${podName}: ${(e as Error).message}`,
    );
  }

  return { artifactJson, sourceFiles };
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
    const { artifactJson, sourceFiles } = await readArtifactFromPvc(state);

    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: state.jobId,
      contractClassId: state.contractClassId,
      version: state.version,
      status: "success",
      artifactJson,
      sourceFiles,
    });

    logger.info(`Published success result for jobId=${state.jobId}`);
  } catch (e) {
    logger.error(
      `Failed to read artifact for jobId=${state.jobId}: ${(e as Error).message}`,
    );

    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: state.jobId,
      contractClassId: state.contractClassId,
      version: state.version,
      status: "compilation_failed",
      error: `Failed to read compiled artifact: ${(e as Error).message}`,
    });
  }

  // Cleanup
  await deletePvc(state.pvcName);
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

  await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
    jobId: state.jobId,
    contractClassId: state.contractClassId,
    version: state.version,
    status,
    error: reason,
  });

  // Cleanup
  await deletePvc(state.pvcName);
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
    // Don't publish failure -- let Kafka backpressure handle it by not committing offset
    // Actually, we need to reject explicitly since we consumed the message
    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: event.jobId,
      contractClassId: event.contractClassId,
      version: event.version,
      status: "compilation_failed",
      error: "Server at maximum compilation capacity. Please try again later.",
    });
    return;
  }

  const jName = jobName(event.jobId);
  const pName = pvcName(event.jobId);

  const state: JobState = {
    jobId: event.jobId,
    k8sJobName: jName,
    pvcName: pName,
    contractClassId: event.contractClassId,
    version: event.version,
    githubUrl: event.githubUrl,
    gitRef: event.gitRef,
    subPath: event.subPath,
    aztecVersion: event.aztecVersion,
    createdAt: new Date(),
  };

  try {
    // Create PVC first, then the Job
    await createPvc(pName);
    await createCompileJob(state);
    activeJobs.set(event.jobId, state);
    logger.info(`Started compile job: jobId=${event.jobId} k8sJob=${jName}`);
  } catch (e) {
    logger.error(
      `Failed to create compile job for jobId=${event.jobId}: ${(e as Error).message}`,
    );

    // Clean up PVC if it was created
    await deletePvc(pName);

    await publishMessage("COMPILE_SOURCE_RESULT_EVENT", {
      jobId: event.jobId,
      contractClassId: event.contractClassId,
      version: event.version,
      status: "compilation_failed",
      error: `Failed to create compile job: ${(e as Error).message}`,
    });
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
        const state: JobState = {
          jobId,
          k8sJobName: job.metadata?.name ?? jobName(jobId),
          pvcName: pvcName(jobId),
          contractClassId: "unknown-recovery",
          version: 0,
          githubUrl: "unknown-recovery",
          aztecVersion: "unknown-recovery",
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
  init: () => {
    initK8sClient();
    logger.info("K8s client initialized");
  },
  health: () => true,
  shutdown: () => {
    stopJobPoller();
    logger.info("Job manager shut down");
  },
};
