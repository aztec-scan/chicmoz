import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  L1L2ValidatorEvent,
  generateL1TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { getL1NetworkId } from "@chicmoz-pkg/types";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { l1 } from "../../svcs/database/controllers/index.js";

const onL1L2Validator = async (event: L1L2ValidatorEvent) => {
  await l1.updateValidatorsState(event);
};

export const l1L2ValidatorHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "l1L2ValidatorHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_L2_VALIDATOR_EVENT",
  ),
  cb: onL1L2Validator as (arg0: unknown) => Promise<void>,
};
