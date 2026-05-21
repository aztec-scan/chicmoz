import { L2_BLOCK_RECONCILIATION_INTERVAL_MS } from "../../environment.js";
import { l2BlockRangeRequest } from "../../events/emitted/index.js";
import { logger } from "../../logger.js";
import {
  buildMissingBlockRangeRequest,
  buildTipBoundaryRepairRequest,
} from "../database/controllers/l2block/missing-ranges.js";

let interval: NodeJS.Timeout | undefined;
let running = false;

export const runL2BlockReconciliationOnce = async () => {
  if (running) {
    logger.info("Skipping L2 block reconciliation tick: previous tick still running");
    return;
  }
  running = true;
  const startedAt = Date.now();
  try {
    await l2BlockRangeRequest(await buildMissingBlockRangeRequest({ reason: "cadence" }));
    await l2BlockRangeRequest(await buildTipBoundaryRepairRequest());
    logger.info(`L2 block reconciliation tick completed in ${Date.now() - startedAt}ms`);
  } catch (error) {
    logger.error(`L2 block reconciliation tick failed: ${(error as Error).message}`);
  } finally {
    running = false;
  }
};

export const startL2BlockReconciliation = () => {
  if (interval) {
    return;
  }
  logger.info(
    `Starting cadenced L2 block reconciliation every ${L2_BLOCK_RECONCILIATION_INTERVAL_MS}ms`,
  );
  interval = setInterval(() => {
    void runL2BlockReconciliationOnce();
  }, L2_BLOCK_RECONCILIATION_INTERVAL_MS);
};

export const stopL2BlockReconciliation = () => {
  if (interval) {
    clearInterval(interval);
    interval = undefined;
  }
};
