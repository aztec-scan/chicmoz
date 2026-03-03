import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  CompileSourceResultEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { controllers as db } from "../../svcs/database/index.js";
import { verifyArtifact } from "../../svcs/http-server/routes/controllers/contract-classes.js";

const onCompileSourceResult = async (event: CompileSourceResultEvent) => {
  const {
    jobId,
    contractClassId,
    version,
    status,
    artifactJson,
    sourceFiles,
    error,
  } = event;

  logger.info(
    `Received compile source result for job ${jobId}: status=${status}`,
  );

  try {
    if (status !== "success") {
      const errorMessage = error ?? `Compilation ${status.replace("_", " ")}`;
      await db.l2Contract.updateSourceVerificationJobStatus({
        jobId,
        status: "FAILED",
        error: errorMessage,
      });
      logger.warn(`Source verification job ${jobId} failed: ${errorMessage}`);
      return;
    }

    if (!artifactJson) {
      await db.l2Contract.updateSourceVerificationJobStatus({
        jobId,
        status: "FAILED",
        error: "Compilation succeeded but no artifact was produced",
      });
      return;
    }

    // Update job status to VERIFYING
    await db.l2Contract.updateSourceVerificationJobStatus({
      jobId,
      status: "VERIFYING",
    });

    // Verify the artifact bytecode matches the on-chain contract class
    try {
      const result = await verifyArtifact({
        contractClassId,
        version,
        stringifiedArtifactJson: artifactJson,
      });

      if (!result.success) {
        await db.l2Contract.updateSourceVerificationJobStatus({
          jobId,
          status: "FAILED",
          error: "Artifact verification failed: bytecode mismatch",
        });
        return;
      }

      // Get the job to retrieve the GitHub URL
      const job = await db.l2Contract.getSourceVerificationJob(jobId);
      if (!job) {
        logger.error(`Job ${jobId} not found after verification`);
        return;
      }

      // Store source code and URL
      if (sourceFiles && sourceFiles.length > 0) {
        await db.l2Contract.addSourceCode({
          contractClassId,
          version,
          sourceCode: sourceFiles,
          sourceCodeUrl: job.githubUrl,
        });
      }

      // Mark job as verified
      await db.l2Contract.updateSourceVerificationJobStatus({
        jobId,
        status: "VERIFIED",
      });

      logger.info(
        `Source verification job ${jobId} completed successfully for contract class ${contractClassId}@${version}`,
      );
    } catch (verifyError) {
      const errorMsg =
        verifyError instanceof Error
          ? verifyError.message
          : "Unknown verification error";
      await db.l2Contract.updateSourceVerificationJobStatus({
        jobId,
        status: "FAILED",
        error: `Verification failed: ${errorMsg}`,
      });
      logger.error(
        `Source verification job ${jobId} verification error: ${errorMsg}`,
      );
    }
  } catch (outerError) {
    logger.error(
      `Unexpected error processing compile source result for job ${jobId}:`,
      outerError,
    );
    try {
      await db.l2Contract.updateSourceVerificationJobStatus({
        jobId,
        status: "FAILED",
        error: "Internal error processing compilation result",
      });
    } catch (updateError) {
      logger.error(
        `Failed to update job ${jobId} status after error:`,
        updateError,
      );
    }
  }
};

export const compileSourceResultHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "compileSourceResultHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "COMPILE_SOURCE_RESULT_EVENT"),
  cb: onCompileSourceResult as (arg0: unknown) => Promise<void>,
};
