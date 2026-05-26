import { type L2TipsEvent } from "@chicmoz-pkg/message-registry";
import { logger } from "../logger.js";
import { sendL2TipsToClients } from "../ws-server/index.js";

export const onL2Tips = (event: L2TipsEvent) => {
  logger.info(
    `onL2Tips proposed=${event.tips.proposed.number} proven=${event.tips.proven.block.number}`,
  );
  sendL2TipsToClients(event.tips);
};
