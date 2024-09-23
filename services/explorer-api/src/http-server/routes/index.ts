import { Router } from "express";
import * as controller from "./controller.js";

export const init = ({
  router,
}: {
  router: Router;
}) => {
  router.get(`/health`, controller.GET_HEALTH);

  router.get(`/l2/latest-height`, controller.GET_LATEST_HEIGHT);
  router.get(`/l2/blocks/latest`, controller.GET_LATEST_BLOCK);
  router.get(`/l2/blocks/:heightOrHash`, controller.GET_BLOCK);
  router.get(`/l2/blocks`, controller.GET_BLOCKS);

  router.get(`/l2/blocks/:blockHeight/txEffects`, controller.GET_L2_TX_EFFECTS_BY_BLOCK_HEIGHT);
  router.get(`/l2/blocks/:blockHeight/txEffects/:txEffectIndex`, controller.GET_L2_TX_EFFECT_BY_BLOCK_HEIGHT_AND_INDEX);
  router.get(`/l2/txEffects/:txHash`, controller.GET_L2_TX_EFFECT_BY_TX_HASH);

  // router.get(`/l2/contract-classes`, controller.GET_L2_CONTRACT_CLASSES);
  // router.get(`/l2/contract-classes/:contractClassId`, controller.GET_L2_CONTRACT_CLASS);

  // router.get(`/l2/contract-classes/:contractClassId/contract-instances`, controller.GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID);
  router.get(`/l2/blocks/:blockHash/contract-instances`, controller.GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH);
  router.get(`/l2/contract-instances/:address`, controller.GET_L2_CONTRACT_INSTANCE);

  return router;
};
