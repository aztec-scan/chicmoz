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
const AZTEC_VERSION = "4.0.3";

const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 60; // 10 minutes max

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
    aztecVersion: AZTEC_VERSION,
  });

  const submitRes = await callExplorerApi({
    loggingString: `🔬 submitSourceVerification ${contractLoggingName}`,
    urlStr: verifyUrl,
    postData,
    method: "POST",
    waitForIndexing: true,
  });

  // 202 = job created, 200 = already verified
  if (submitRes.statusCode !== 202 && submitRes.statusCode !== 200) {
    logger.error(
      `Source verification submission failed: ${submitRes.statusCode} ${submitRes.data}`,
    );
    return;
  }

  const submitBody = JSON.parse(submitRes.data) as Record<string, unknown>;

  if (submitRes.statusCode === 200) {
    logger.info(
      `Source already verified (status=${submitBody.status as string}, sourceCodeUrl=${submitBody.sourceCodeUrl as string})`,
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
      logger.warn(`Poll returned ${pollRes.statusCode}: ${pollRes.data}`);
      continue;
    }

    const job = JSON.parse(pollRes.data) as Record<string, unknown>;
    const status = job.status as string;
    logger.info(`  Job status: ${status}`);

    if (status === "VERIFIED") {
      logger.info("Source code VERIFIED successfully!");

      // Step 5: Fetch the verified source code
      logger.info("Step 5: Fetching verified source code...");
      const sourceUrl = `${EXPLORER_API_URL}/l2/contract-classes/${contractClassId}/versions/${version}/source`;
      const sourceRes = await getExplorerApi({
        urlStr: sourceUrl,
        loggingString: `🔬 fetchVerifiedSource ${contractLoggingName}`,
      });

      if (sourceRes.statusCode === 200) {
        const sourceBody = JSON.parse(sourceRes.data) as Record<
          string,
          unknown
        >;
        const sourceFiles = sourceBody.sourceCode as
          | { path: string; content: string }[]
          | undefined;
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
      const error = job.error as string | undefined;
      logger.error(`Source verification FAILED: ${error ?? "unknown error"}`);
      return;
    }

    // Still in progress (PENDING / COMPILING / VERIFYING)
  }

  logger.error(
    `Source verification timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`,
  );
}
