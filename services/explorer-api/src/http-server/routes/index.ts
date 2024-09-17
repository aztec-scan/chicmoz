import { Router } from "express";
import * as controller from "./controller.js";

export const init = ({
  router,
}: {
  router: Router;
}) => {
  router.get(`/health`, controller.GET_HEALTH);

  router.get(`/latest-height`, controller.GET_LATEST_HEIGHT);
  router.get(`/blocks/latest`, controller.GET_LATEST_BLOCK);
  router.get(`/blocks/:heightOrHash`, controller.GET_BLOCK);
  // router.get(`/blocks`, controller.GET_BLOCKS);
  return router;
};
