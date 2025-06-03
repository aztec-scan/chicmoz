import {
  INIFINITE_LOOP,
  SCENARIO_AZTEC_STANDARD_TOKEN_CONTRACT,
  SCENARIO_DELAY,
  SCENARIO_DEPLOY_AND_UPDATE,
  SCENARIO_FUNCTIONS_VOTE,
  SCENARIO_L1L2_PRIVATE_MESSAGING,
  SCENARIO_L1L2_PUBLIC_MESSAGING,
  SCENARIO_SIMPLE_CONTRACT,
  SCENARIO_SIMPLE_DEFAULT_ACCOUNT,
  SCENARIO_SIMPLE_LOG,
  SCENARIO_TOKEN_CONTRACT,
} from "../environment.js";
import { logger } from "../logger.js";
import { setup } from "./pxe.js";
import * as scenarios from "./scenarios/index.js";

let isShutdown = false;
const scenariosToRun: {
  envVar: string;
  scenario: () => Promise<void>;
}[] = [];

export async function init() {
  logger.info("Initializing Cannon...");
  if (SCENARIO_SIMPLE_DEFAULT_ACCOUNT) {
    scenariosToRun.push({
      envVar: "SCENARIO_SIMPLE_DEFAULT_ACCOUNT",
      scenario: scenarios.deploySimpleDefaultAccount,
    });
  }

  if (SCENARIO_TOKEN_CONTRACT) {
    scenariosToRun.push({
      envVar: "SCENARIO_TOKEN_CONTRACT",
      scenario: scenarios.deployAndInteractTokenContract,
    });
  }

  if (SCENARIO_DEPLOY_AND_UPDATE) {
    scenariosToRun.push({
      envVar: "SCENARIO_DEPLOY_AND_UPDATE",
      scenario: scenarios.deployAndUpdateSimpleContract,
    });
  }
  if (SCENARIO_FUNCTIONS_VOTE) {
    scenariosToRun.push({
      envVar: "SCENARIO_FUNCTIONS_VOTE",
      scenario: scenarios.deployAndInteractFunctionsVote,
    });
  }

  if (SCENARIO_SIMPLE_CONTRACT) {
    scenariosToRun.push({
      envVar: "SCENARIO_SIMPLE_CONTRACT",
      scenario: scenarios.deploySimpleContract,
    });
  }

  if (SCENARIO_SIMPLE_LOG) {
    scenariosToRun.push({
      envVar: "SCENARIO_SIMPLE_LOG",
      scenario: scenarios.deploySimpleLog,
    });
  }

  if (SCENARIO_L1L2_PUBLIC_MESSAGING) {
    scenariosToRun.push({
      envVar: "SCENARIO_L1L2_PUBLIC_MESSAGING",
      scenario: scenarios.l1L2PublicMessaging,
    });
  }

  if (SCENARIO_L1L2_PRIVATE_MESSAGING) {
    scenariosToRun.push({
      envVar: "SCENARIO_L1L2_PRIVATE_MESSAGING",
      scenario: scenarios.l1L2PrivateMessaging,
    });
  }

  if (SCENARIO_AZTEC_STANDARD_TOKEN_CONTRACT) {
    scenariosToRun.push({
      envVar: "SCENARIO_AZTEC_STANDARD_TOKEN_CONTRACT",
      scenario: scenarios.deployAztecStandardTokenContract,
    });
  }

  logger.info(`
SCENARIO_DELAY:                  ${SCENARIO_DELAY / 1000} seconds
INIFINITE_LOOP:                  ${INIFINITE_LOOP ? "✅" : "❌"}
=======================
SCENARIO_SIMPLE_DEFAULT_ACCOUNT:        ${
    SCENARIO_SIMPLE_DEFAULT_ACCOUNT ? "✅" : "❌"
  }
SCENARIO_TOKEN_CONTRACT:                ${SCENARIO_TOKEN_CONTRACT ? "✅" : "❌"}
SCENARIO_DEPLOY_AND_UPDATE:             ${SCENARIO_DEPLOY_AND_UPDATE ? "✅" : "❌"}
SCENARIO_FUNCTIONS_VOTE:                ${SCENARIO_FUNCTIONS_VOTE ? "✅" : "❌"}
SCENARIO_SIMPLE_CONTRACT:               ${SCENARIO_SIMPLE_CONTRACT ? "✅" : "❌"}
SCENARIO_SIMPLE_LOG:                    ${SCENARIO_SIMPLE_LOG ? "✅" : "❌"}
SCENARIO_L1L2_PUBLIC_MESSAGING:         ${SCENARIO_L1L2_PUBLIC_MESSAGING ? "✅" : "❌"}
SCENARIO_L1L2_PRIVATE_MESSAGING:        ${SCENARIO_L1L2_PRIVATE_MESSAGING ? "✅" : "❌"}
SCENARIO_AZTEC_STANDARD_TOKEN_CONTRACT: ${SCENARIO_AZTEC_STANDARD_TOKEN_CONTRACT ? "✅" : "❌"}
`);

  await setup();
  return {
    id: "Cannon",
    // eslint-disable-next-line @typescript-eslint/require-await
    shutdownCb: async () => {
      logger.info("Shutting down Cannon...");
      isShutdown = true;
    },
  };
}

const runScenarios = async () => {
  for (const scenario of scenariosToRun) {
    if (isShutdown) {
      return;
    }
    logger.info(`Running scenario: ${scenario.envVar}`);
    try {
      await scenario.scenario();
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error(`Error running scenario: ${(e as Error).stack ?? e}`);
    }
    logger.info(
      `waiting ${SCENARIO_DELAY / 1000} seconds before next scenario...`,
    );
    await new Promise((resolve) => setTimeout(resolve, SCENARIO_DELAY));
  }
};

export const start = async () => {
  logger.info("Starting Cannon...");
  let loopCount = 0;
  if (INIFINITE_LOOP) {
    while (!isShutdown) {
      logger.info(`\nLoop count: ${loopCount++}`);
      await runScenarios();
    }
  } else {
    await runScenarios();
  }
  logger.info("Cannon shutdown complete");
};
