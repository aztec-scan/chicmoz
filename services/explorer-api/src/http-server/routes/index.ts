import { Router } from "express";
import * as controller from "./controllers/index.js";
import { paths } from "./paths_and_validation.js";
import assert from "assert";
import { logger } from "../../logger.js";

export const openApiPaths = {
  ...controller.openapi_GET_LATEST_HEIGHT,
  ...controller.openapi_GET_LATEST_BLOCK,
  ...controller.openapi_GET_BLOCK,
  ...controller.openapi_GET_BLOCKS,

  ...controller.openapi_GET_L2_TX_EFFECTS_BY_BLOCK_HEIGHT,
  ...controller.openapi_GET_L2_TX_EFFECT_BY_BLOCK_HEIGHT_AND_INDEX,
  ...controller.openapi_GET_L2_TX_EFFECT_BY_TX_EFFECT_HASH,

  ...controller.openapi_GET_PENDING_TXS,

  ...controller.openapi_GET_L2_REGISTERED_CONTRACT_CLASS,
  ...controller.openapi_GET_L2_REGISTERED_CONTRACT_CLASSES_ALL_VERSIONS,
  ...controller.openapi_GET_L2_REGISTERED_CONTRACT_CLASSES,

  ...controller.openapi_GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTIONS,
  ...controller.openapi_GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTION,
  ...controller.openapi_GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTIONS,
  ...controller.openapi_GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTION,

  ...controller.openapi_GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH,
  ...controller.openapi_GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID,
  ...controller.openapi_GET_L2_CONTRACT_INSTANCE,
  ...controller.openapi_GET_L2_CONTRACT_INSTANCES,

  ...controller.openapi_SEARCH,
};

const statsPaths = [
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
  const totalPaths = Object.keys(paths).length;
  const totalStatsPaths = statsPaths.length;
  const totalOpenApiPaths = Object.keys(openApiPaths).length;
  try {
    assert(totalPaths - totalStatsPaths === totalOpenApiPaths);
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`STARTING SERVER WITHOUT SUFFICIENT DOCS! ${totalPaths} - ${totalStatsPaths} !== ${totalOpenApiPaths}`);
  }
}

export const init = ({ router }: { router: Router }) => {
  checkDocsStatus();
  router.get("/l2/index", controller.GET_ROUTES);
  router.get("/aztec-chain-connection", controller.GET_AZTEC_CHAIN_CONNECTION);

  router.get(paths.latestHeight, controller.GET_LATEST_HEIGHT);
  router.get(paths.latestBlock, controller.GET_LATEST_BLOCK);
  router.get(paths.block, controller.GET_BLOCK);
  router.get(paths.blocks, controller.GET_BLOCKS);

  router.get(paths.txEffectsByBlockHeight, controller.GET_L2_TX_EFFECTS_BY_BLOCK_HEIGHT);
  router.get(paths.txEffectByBlockHeightAndIndex, controller.GET_L2_TX_EFFECT_BY_BLOCK_HEIGHT_AND_INDEX);
  router.get(paths.txEffectsByTxEffectHash, controller.GET_L2_TX_EFFECT_BY_TX_EFFECT_HASH);

  router.get(paths.txs, controller.GET_PENDING_TXS);

  router.get(paths.contractClass, controller.GET_L2_REGISTERED_CONTRACT_CLASS);
  router.get(paths.contractClassesByClassId, controller.GET_L2_REGISTERED_CONTRACT_CLASSES_ALL_VERSIONS);
  router.get(paths.contractClasses, controller.GET_L2_REGISTERED_CONTRACT_CLASSES);

  router.get(paths.contractClassPrivateFunctions, controller.GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTIONS);
  router.get(paths.contractClassPrivateFunction, controller.GET_L2_CONTRACT_CLASS_PRIVATE_FUNCTION);
  router.get(paths.contractClassUnconstrainedFunctions, controller.GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTIONS);
  router.get(paths.contractClassUnconstrainedFunction, controller.GET_L2_CONTRACT_CLASS_UNCONSTRAINED_FUNCTION);

  router.get(paths.contractInstancesByBlockHash, controller.GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH);
  router.get(paths.contractInstancesByContractClassId, controller.GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID);
  router.get(paths.contractInstance, controller.GET_L2_CONTRACT_INSTANCE);
  router.get(paths.contractInstances, controller.GET_L2_CONTRACT_INSTANCES);

  router.get(paths.search, controller.L2_SEARCH);

  statsPaths.forEach(({ path, controller }) => {
    router.get(path, controller);
  });

  return router;
};
