import { l2NetworkIdSchema, type L2NetworkId } from "@chicmoz-pkg/types";
import { z } from "zod";

export const L2_NETWORK_ID: L2NetworkId = l2NetworkIdSchema.parse(
  process.env.L2_NETWORK_ID,
);

export const COMPILER_IMAGE = z
  .string()
  .default("contract-compiler:4.0.3")
  .parse(process.env.COMPILER_IMAGE);

export const K8S_NAMESPACE = z
  .string()
  .default("chicmoz")
  .parse(process.env.K8S_NAMESPACE);

export const MAX_CONCURRENT_JOBS = z.coerce
  .number()
  .default(3)
  .parse(process.env.MAX_CONCURRENT_JOBS);

export const JOB_TIMEOUT_SECONDS = z.coerce
  .number()
  .default(300)
  .parse(process.env.JOB_TIMEOUT_SECONDS);

export const JOB_TTL_AFTER_FINISHED_SECONDS = z.coerce
  .number()
  .default(300)
  .parse(process.env.JOB_TTL_AFTER_FINISHED_SECONDS);

export const JOB_POLL_INTERVAL_MS = z.coerce
  .number()
  .default(5000)
  .parse(process.env.JOB_POLL_INTERVAL_MS);

export const JOB_CPU_REQUEST = z
  .string()
  .default("500m")
  .parse(process.env.JOB_CPU_REQUEST);

export const JOB_CPU_LIMIT = z
  .string()
  .default("2")
  .parse(process.env.JOB_CPU_LIMIT);

export const JOB_MEMORY_REQUEST = z
  .string()
  .default("2Gi")
  .parse(process.env.JOB_MEMORY_REQUEST);

export const JOB_MEMORY_LIMIT = z
  .string()
  .default("4Gi")
  .parse(process.env.JOB_MEMORY_LIMIT);

export const EMPTYDIR_SIZE_LIMIT = z
  .string()
  .default("1Gi")
  .parse(process.env.EMPTYDIR_SIZE_LIMIT);

export const READER_POD_IMAGE = z
  .string()
  .default("alpine:3.19")
  .parse(process.env.READER_POD_IMAGE);

export const SERVICE_NAME = "compiler-orchestrator";

export const getConfigStr = () => `COMPILER ORCHESTRATOR
L2_NETWORK_ID:                ${L2_NETWORK_ID}
COMPILER_IMAGE:               ${COMPILER_IMAGE}
K8S_NAMESPACE:                ${K8S_NAMESPACE}
MAX_CONCURRENT_JOBS:          ${MAX_CONCURRENT_JOBS}
JOB_TIMEOUT_SECONDS:          ${JOB_TIMEOUT_SECONDS}
JOB_POLL_INTERVAL_MS:         ${JOB_POLL_INTERVAL_MS}
JOB_CPU_REQUEST:              ${JOB_CPU_REQUEST}
JOB_CPU_LIMIT:                ${JOB_CPU_LIMIT}
JOB_MEMORY_REQUEST:           ${JOB_MEMORY_REQUEST}
JOB_MEMORY_LIMIT:             ${JOB_MEMORY_LIMIT}
EMPTYDIR_SIZE_LIMIT:          ${EMPTYDIR_SIZE_LIMIT}`;
