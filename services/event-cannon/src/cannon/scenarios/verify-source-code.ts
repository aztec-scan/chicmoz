import { DeployMethod } from "@aztec/aztec.js/contracts";
import { NoirCompiledContract } from "@aztec/aztec.js/abi";
import { SimpleLoggingContract } from "../../artifacts/SimpleLogging.js";
import artifactJson from "../../contract-projects/SimpleLogging/target/simple_logging-SimpleLogging.json" with { type: "json" };
import { logger } from "../../logger.js";
import { getAztecNodeClient, getAccounts, getWallet } from "../pxe.js";
import {
  deployContract,
  registerContractClassArtifact,
} from "./utils/index.js";
import { callExplorerApi, getExplorerApi } from "./utils/explorer-api.js";
import { EXPLORER_API_URL } from "../../environment.js";

const GITHUB_URL = "https://github.com/aztec-scan/chicmoz";
const GIT_REF = "production-devnet";
const SUB_PATH = "services/event-cannon/src/contract-projects/SimpleLogging";
const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 60; // 10 minutes max

type ExplorerApiResponse = {
  statusCode: number | undefined;
  statusMessage: string | undefined;
  data: string;
};

const parseJsonBody = (
  response: ExplorerApiResponse,
  context: string,
): Record<string, unknown> | undefined => {
  try {
    return JSON.parse(response.data) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      `${context} returned a non-JSON body (${message}). Raw body: ${response.data}`,
    );
    return undefined;
  }
};

const logApiResponse = (context: string, response: ExplorerApiResponse) => {
  logger.info(
    `${context} response: ${JSON.stringify({
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      data: response.data,
    })}`,
  );
};

const logVerificationJobDetails = (
  job: Record<string, unknown>,
  context: string,
) => {
  const status = job.status as string | undefined;
  const failureStage = job.failureStage as string | undefined;
  const error = job.error as string | undefined;
  const compileOutput = job.compileOutput as string | undefined;
  const commitHash = job.commitHash as string | undefined;

  logger.info(
    `${context}: ${JSON.stringify({
      status,
      failureStage,
      error,
      commitHash,
    })}`,
  );

  if (compileOutput) {
    logger.info(`${context} compile output:\n${compileOutput}`);
  }
};

export async function run() {
  logger.info("===== VERIFY SOURCE CODE =====");
  const namedWallets = getAccounts();
  const wallet = getWallet();
  const deployerWallet = namedWallets.alice;

  const contractLoggingName = "SimpleLogging (verify-source)";

  // Step 1: Deploy the contract so we have a contract class on-chain
  logger.info("Step 1: Deploying SimpleLogging contract...");
  const { instance: contractInstance } = await deployContract({
    contractLoggingName,
    deployFn: (): DeployMethod<SimpleLoggingContract> =>
      SimpleLoggingContract.deploy(wallet, 10, getAccounts().charlie.address),
    from: deployerWallet.address,
    node: getAztecNodeClient(),
  });

  const contractClassId = contractInstance.currentContractClassId.toString();
  const version = contractInstance.version;

  // Step 2: Register the artifact first (so bytecode is available for comparison)
  logger.info("Step 2: Registering artifact for bytecode comparison...");
  await registerContractClassArtifact(
    contractLoggingName,
    artifactJson as unknown as NoirCompiledContract,
    contractClassId,
    version,
  );

  // Step 3: Submit source verification request
  logger.info(
    `Step 3: Submitting source verification for classId=${contractClassId} version=${version}`,
  );
  logger.info(`  GitHub URL: ${GITHUB_URL}`);
  logger.info(`  Sub path:   ${SUB_PATH}`);

  const verifyUrl = `${EXPLORER_API_URL}/l2/contract-classes/${contractClassId}/versions/${version}/verify-source`;
  const postData = JSON.stringify({
    githubUrl: GITHUB_URL,
    gitRef: GIT_REF,
    subPath: SUB_PATH,
  });

  const submitRes = await callExplorerApi({
    loggingString: `🔬 submitSourceVerification ${contractLoggingName}`,
    urlStr: verifyUrl,
    postData,
    method: "POST",
    waitForIndexing: true,
  });

  logApiResponse("Source verification submit", submitRes);

  // 202 = job created, 200 = already verified
  if (submitRes.statusCode !== 202 && submitRes.statusCode !== 200) {
    logger.error(
      `Source verification submission failed: ${JSON.stringify({
        statusCode: submitRes.statusCode,
        statusMessage: submitRes.statusMessage,
        data: submitRes.data,
      })}`,
    );
    return;
  }

  const submitBody = parseJsonBody(submitRes, "Source verification submit");
  if (!submitBody) {
    logger.error(
      "Source verification submission succeeded but response body was invalid",
    );
    return;
  }

  if (submitRes.statusCode === 200) {
    logger.info(
      `Source already verified: ${JSON.stringify({
        status: submitBody.status,
        sourceCodeUrl: submitBody.sourceCodeUrl,
      })}`,
    );
    return;
  }

  const jobId = submitBody.jobId as string;
  logger.info(`Source verification job created: jobId=${jobId}`);

  // Step 4: Poll for job completion
  logger.info("Step 4: Polling job status...");
  const jobUrl = `${verifyUrl}/${jobId}`;

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const pollRes = await getExplorerApi({
      urlStr: jobUrl,
      loggingString: `🔬 pollVerification attempt ${attempt}/${MAX_POLL_ATTEMPTS}`,
    });

    if (pollRes.statusCode !== 200) {
      logger.warn(
        `Poll returned unexpected response: ${JSON.stringify({
          statusCode: pollRes.statusCode,
          statusMessage: pollRes.statusMessage,
          data: pollRes.data,
        })}`,
      );
      continue;
    }

    logApiResponse(`Poll attempt ${attempt}`, pollRes);

    const job = parseJsonBody(pollRes, `Poll attempt ${attempt}`);
    if (!job) {
      continue;
    }

    const status = job.status as string;
    logVerificationJobDetails(job, `Job update attempt ${attempt}`);

    if (status === "VERIFIED") {
      logger.info("Source code VERIFIED successfully!");

      // Step 5: Fetch the verified source code
      logger.info("Step 5: Fetching verified source code...");
      const sourceUrl = `${EXPLORER_API_URL}/l2/contract-classes/${contractClassId}/versions/${version}/source`;
      const sourceRes = await getExplorerApi({
        urlStr: sourceUrl,
        loggingString: `🔬 fetchVerifiedSource ${contractLoggingName}`,
      });

      logApiResponse("Fetch verified source", sourceRes);

      if (sourceRes.statusCode === 200) {
        const sourceBody = parseJsonBody(sourceRes, "Fetch verified source");
        if (!sourceBody) {
          logger.warn(
            "Verified source fetch succeeded but response body was invalid",
          );
          logger.info("===== VERIFY SOURCE CODE COMPLETE =====");
          return;
        }

        const sourceFiles = sourceBody.sourceCode as
          | { path: string; content: string }[]
          | undefined;
        logger.info(
          `  Source metadata: ${JSON.stringify({
            sourceCodeUrl: sourceBody.sourceCodeUrl,
            sourceCodeCommitHash: sourceBody.sourceCodeCommitHash,
          })}`,
        );
        logger.info(`  Retrieved ${sourceFiles?.length ?? 0} source file(s)`);
        if (sourceFiles) {
          for (const f of sourceFiles) {
            logger.info(`    - ${f.path} (${f.content.length} chars)`);
          }
        }
      } else {
        logger.warn(
          `Failed to fetch source: ${sourceRes.statusCode} ${sourceRes.data}`,
        );
      }

      logger.info("===== VERIFY SOURCE CODE COMPLETE =====");
      return;
    }

    if (status === "FAILED") {
      logger.error(
        `Source verification FAILED: ${JSON.stringify({
          error: job.error ?? "unknown error",
          failureStage: job.failureStage,
          compileOutput: job.compileOutput,
        })}`,
      );
      return;
    }

    // Still in progress (PENDING / COMPILING / VERIFYING)
  }

  logger.error(
    `Source verification timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`,
  );
}
