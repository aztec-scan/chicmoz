import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import type { SourceVerificationStatus } from "@chicmoz-pkg/types";
import { and, eq, inArray } from "drizzle-orm";
import {
  l2ContractClassRegistered,
  sourceVerificationJobs,
} from "../../schema/l2contract/index.js";

export const createSourceVerificationJob = async ({
  id,
  contractClassId,
  version,
  githubUrl,
  gitRef,
  subPath,
  aztecVersion,
}: {
  id: string;
  contractClassId: string;
  version: number;
  githubUrl: string;
  gitRef?: string;
  subPath?: string;
  aztecVersion: string;
}): Promise<void> => {
  await db()
    .insert(sourceVerificationJobs)
    .values({
      id,
      contractClassId,
      version,
      githubUrl,
      gitRef: gitRef ?? null,
      subPath: subPath ?? null,
      aztecVersion,
      status: "PENDING",
    });
};

export const getSourceVerificationJob = async (
  jobId: string,
): Promise<typeof sourceVerificationJobs.$inferSelect | null> => {
  const result = await db()
    .select()
    .from(sourceVerificationJobs)
    .where(eq(sourceVerificationJobs.id, jobId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
};

export const getSourceVerificationJobsByContractClass = async (
  contractClassId: string,
  version: number,
): Promise<Array<typeof sourceVerificationJobs.$inferSelect>> => {
  return db()
    .select()
    .from(sourceVerificationJobs)
    .where(
      and(
        eq(sourceVerificationJobs.contractClassId, contractClassId),
        eq(sourceVerificationJobs.version, version),
      ),
    );
};

export const updateSourceVerificationJobStatus = async ({
  jobId,
  status,
  error,
  commitHash,
}: {
  jobId: string;
  status: SourceVerificationStatus;
  error?: string;
  commitHash?: string;
}): Promise<void> => {
  const updateValues: Record<string, unknown> = {
    status,
    error: error ?? null,
  };
  if (commitHash !== undefined) {
    updateValues.commitHash = commitHash;
  }
  await db()
    .update(sourceVerificationJobs)
    .set(updateValues)
    .where(eq(sourceVerificationJobs.id, jobId));
};

export const addSourceCode = async ({
  contractClassId,
  version,
  sourceCode,
  sourceCodeUrl,
  sourceCodeCommitHash,
}: {
  contractClassId: string;
  version: number;
  sourceCode: Array<{ path: string; content: string }>;
  sourceCodeUrl: string;
  sourceCodeCommitHash?: string;
}): Promise<void> => {
  await db()
    .update(l2ContractClassRegistered)
    .set({
      sourceCode,
      sourceCodeUrl,
      sourceCodeCommitHash: sourceCodeCommitHash ?? null,
    })
    .where(
      and(
        eq(l2ContractClassRegistered.contractClassId, contractClassId),
        eq(l2ContractClassRegistered.version, version),
      ),
    );
};

export const getActiveVerificationJobCount = async (): Promise<number> => {
  const result = await db()
    .select()
    .from(sourceVerificationJobs)
    .where(
      inArray(sourceVerificationJobs.status, [
        "PENDING",
        "COMPILING",
        "VERIFYING",
      ]),
    );
  return result.length;
};

export const getContractClassSourceCode = async (
  contractClassId: string,
  version: number,
): Promise<{
  sourceCode: Array<{ path: string; content: string }> | null;
  sourceCodeCommitHash: string | null;
}> => {
  const result = await db()
    .select({
      sourceCode: l2ContractClassRegistered.sourceCode,
      sourceCodeCommitHash: l2ContractClassRegistered.sourceCodeCommitHash,
    })
    .from(l2ContractClassRegistered)
    .where(
      and(
        eq(l2ContractClassRegistered.contractClassId, contractClassId),
        eq(l2ContractClassRegistered.version, version),
      ),
    )
    .limit(1);
  if (result.length === 0) {
    return { sourceCode: null, sourceCodeCommitHash: null };
  }
  return {
    sourceCode: result[0].sourceCode ?? null,
    sourceCodeCommitHash: result[0].sourceCodeCommitHash ?? null,
  };
};
