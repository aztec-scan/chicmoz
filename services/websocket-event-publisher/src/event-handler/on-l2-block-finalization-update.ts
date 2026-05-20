import { type ChicmozL2BlockFinalizationUpdateEvent } from "@chicmoz-pkg/message-registry";
import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";
import { logger } from "../logger.js";
import { sendFinalizationUpdateToClients } from "../ws-server/index.js";

export const onL2BlockFinalizationUpdate = (
  update: ChicmozL2BlockFinalizationUpdateEvent
) => {
  logger.info(
    `onL2BlockFinalizationUpdate
Block: ${update.l2BlockHash}
Status: ${ChicmozL2BlockFinalizationStatus[update.status]}`
  );
  sendFinalizationUpdateToClients(update);
};
