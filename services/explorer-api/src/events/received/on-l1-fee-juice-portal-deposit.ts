import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  generateL1TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import {
  ChicmozL1FeeJuicePortalDeposit,
  chicmozL1FeeJuicePortalDepositSchema,
  getL1NetworkId,
} from "@chicmoz-pkg/types";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { store } from "../../svcs/database/controllers/l1/fee-juice-portal-deposit/store.js";

const onDeposit = async (event: ChicmozL1FeeJuicePortalDeposit) => {
  logger.info(
    `🧃 FeeJuicePortal DepositToAztecPublic l1BlockNumber: ${event.l1BlockNumber} ${event.isFinalized ? "✅" : "💤"} to: ${event.to} amount: ${event.amount}`,
  );
  const parsed = chicmozL1FeeJuicePortalDepositSchema.parse(event);
  await store(parsed);
};

export const l1FeeJuicePortalDepositHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "l1FeeJuicePortalDepositHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_FEE_JUICE_PORTAL_DEPOSIT_EVENT",
  ),
  cb: onDeposit as (arg0: unknown) => Promise<void>,
};
