import assert from "assert";
import bodyParser from "body-parser";
import { Router } from "express";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { ARTIFACT_BODY_LIMIT } from "../../../environment.js";
import { logger } from "../../../logger.js";
import * as controller from "./controllers/index.js";
import { paths } from "./paths_and_validation.js";

export const openApiPaths: OpenAPIObject["paths"] = {
  ...controller.openapi_GET_LATEST_HEIGHT,
  ...controller.openapi_GET_LATEST_BLOCK,
  ...controller.openapi_GET_BLOCK,
  ...controller.openapi_GET_BLOCKS, // TODO: rename to L2_GET_BLOCKS?
  ...controller.openapi_GET_BLOCKS_BY_FINALIZATION_STATUS,

  ...controller.openapi_GET_L2_FEE_RECIPIENTS,

  ...controller.openapi_GET_L2_TX_EFFECTS,
  ...controller.openapi_GET_L2_TX_EFFECTS_BY_BLOCK_HEIGHT,
  ...controller.openapi_GET_L2_TX_EFFECT_BY_BLOCK_HEIGHT_AND_INDEX,
  ...controller.openapi_GET_L2_TX_EFFECT_BY_TX_EFFECT_HASH,

  ...controller.openapi_GET_PENDING_TXS,

  ...controller.openapi_GET_L2_REGISTERED_CONTRACT_CLASS,
  ...controller.openapi_GET_L2_REGISTERED_CONTRACT_CLASSES_ALL_VERSIONS,
  ...controller.openapi_GET_L2_REGISTERED_CONTRACT_CLASSES,

  ...controller.openapi_GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTIONS,
  ...controller.openapi_GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTION,
  ...controller.openapi_GET_L2_CONTRACT_CLASS_UTILITY_FUNCTIONS,
  ...controller.openapi_GET_L2_CONTRACT_CLASS_UTILITY_FUNCTION,

  ...controller.openapi_POST_L2_REGISTERED_CONTRACT_CLASS_ARTIFACT,

  ...controller.openapi_GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH,
  ...controller.openapi_GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID,
  ...controller.openapi_GET_L2_CONTRACT_INSTANCE,
  ...controller.openapi_GET_L2_CONTRACT_INSTANCES,
  ...controller.openapi_POST_L2_VERIFY_CONTRACT_INSTANCE_DEPLOYMENT,

  ...controller.openapi_L2_SEARCH,

  ...controller.openapi_GET_L1_L2_VALIDATORS,
  ...controller.openapi_GET_L1_L2_VALIDATOR,
  ...controller.openapi_GET_L1_L2_VALIDATOR_HISTORY,

  ...controller.openapi_GET_L1_CONTRACT_EVENTS,

  ...controller.openapi_GET_CHAIN_INFO,
  ...controller.openapi_GET_CHAIN_ERRORS,

  ...controller.openapi_GET_L2_SEQUENCER,
  ...controller.openapi_GET_L2_SEQUENCERS,
};

const otherPaths = [
  {
    path: paths.statsTotalTxEffects,
    controller: controller.GET_STATS_TOTAL_TX_EFFECTS,
  },
  {
    path: paths.statsTotalTxEffectsLast24h,
    controller: controller.GET_STATS_TOTAL_TX_EFFECTS_LAST_24H,
  },
  {
    path: paths.statsTotalContracts,
    controller: controller.GET_STATS_TOTAL_CONTRACTS,
  },
  {
    path: paths.statsTotalContractsLast24h,
    controller: controller.GET_STATS_TOTAL_CONTRACTS_LAST_24H,
  },
  {
    path: paths.statsAverageFees,
    controller: controller.GET_STATS_AVERAGE_FEES,
  },
  {
    path: paths.statsAverageBlockTime,
    controller: controller.GET_STATS_AVERAGE_BLOCK_TIME,
  },
];

const checkDocsStatus = () => {
  // TODO: this can be improved when this issue is complete: https://github.com/aztec-scan/chicmoz/issues/374
  const totalPaths = Object.keys(paths).length;
  const totalStatsPaths = otherPaths.length;
  const totalOpenApiPaths = Object.keys(openApiPaths).length;
  try {
    const doubleUsagesOfPaths = 1; // TODO: currently there is one path that is used by POST and GET, this is correct. However this simple check-docs-status function should be improved to accept this case.
    assert(totalPaths - totalStatsPaths - doubleUsagesOfPaths === totalOpenApiPaths);
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(
      `⚠️  STARTING SERVER WITHOUT SUFFICIENT DOCS! ${totalPaths} - ${totalStatsPaths} !== ${totalOpenApiPaths} ⚠️`,
    );
  }
};

export const init = ({ router }: { router: Router }) => {
  checkDocsStatus();
  router.get("/l2/index", controller.GET_ROUTES);

  router.get(paths.latestHeight, controller.GET_LATEST_HEIGHT);
  router.get(paths.latestBlock, controller.GET_LATEST_BLOCK);
  router.get(paths.blocksByStatus, controller.GET_BLOCKS_BY_FINALIZATION_STATUS);
  router.get(paths.block, controller.GET_BLOCK);
  router.get(paths.blocks, controller.GET_BLOCKS);
  router.get(paths.feeRecipients, controller.GET_L2_FEE_RECIPIENTS);

  router.get(paths.txEffects, controller.GET_L2_TX_EFFECTS);
  router.get(
    paths.txEffectsByBlockHeight,
    controller.GET_L2_TX_EFFECTS_BY_BLOCK_HEIGHT,
  );
  router.get(
    paths.txEffectByBlockHeightAndIndex,
    controller.GET_L2_TX_EFFECT_BY_BLOCK_HEIGHT_AND_INDEX,
  );
  router.get(
    paths.txEffectsByTxEffectHash,
    controller.GET_L2_TX_EFFECT_BY_TX_EFFECT_HASH,
  );

  router.get(paths.txs, controller.GET_PENDING_TXS);

  router.get(paths.contractClass, controller.GET_L2_REGISTERED_CONTRACT_CLASS);
  router.get(
    paths.contractClassesByClassId,
    controller.GET_L2_REGISTERED_CONTRACT_CLASSES_ALL_VERSIONS,
  );
  router.get(
    paths.contractClasses,
    controller.GET_L2_REGISTERED_CONTRACT_CLASSES,
  );

  router.get(
    paths.contractClassPrivateFunctions,
    controller.GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTIONS,
  );
  router.get(
    paths.contractClassPrivateFunction,
    controller.GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTION,
  );
  router.get(
    paths.contractClassUtilityFunctions,
    controller.GET_L2_CONTRACT_CLASS_UTILITY_FUNCTIONS,
  );
  router.get(
    paths.contractClassUtilityFunction,
    controller.GET_L2_CONTRACT_CLASS_UTILITY_FUNCTION,
  );

  router.post(
    paths.contractClass,
    bodyParser.json({
      limit: ARTIFACT_BODY_LIMIT,
    }),
    controller.POST_L2_REGISTERED_CONTRACT_CLASS_ARTIFACT,
  );

  router.post(
    paths.contractInstance,
    bodyParser.json({
      limit: ARTIFACT_BODY_LIMIT,
    }),
    controller.POST_L2_VERIFY_CONTRACT_INSTANCE_DEPLOYMENT,
  );

  router.get(
    paths.contractInstancesByBlockHash,
    controller.GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH,
  );
  router.get(
    paths.contractInstancesByContractClassId,
    controller.GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID,
  );
  router.get(paths.contractInstance, controller.GET_L2_CONTRACT_INSTANCE);
  router.get(paths.contractInstances, controller.GET_L2_CONTRACT_INSTANCES);

  router.get(paths.search, controller.L2_SEARCH);

  router.get(paths.l1l2Validators, controller.GET_L1_L2_VALIDATORS);
  router.get(paths.l1l2Validator, controller.GET_L1_L2_VALIDATOR);
  router.get(
    paths.l1l2ValidatorHistory,
    controller.GET_L1_L2_VALIDATOR_HISTORY,
  );

  router.get(paths.l1ContractEvents, controller.GET_L1_CONTRACT_EVENTS);

  router.get(paths.chainInfo, controller.GET_CHAIN_INFO);
  router.get(paths.chainErrors, controller.GET_CHAIN_ERRORS);

  router.get(paths.sequencer, controller.GET_L2_SEQUENCER);
  router.get(paths.sequencers, controller.GET_L2_SEQUENCERS);

  otherPaths.forEach(({ path, controller }) => {
    router.get(path, controller);
  });

  return router;
};
