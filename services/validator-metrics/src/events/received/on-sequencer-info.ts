import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  ChicmozSequencerEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { storeL2Sequencer } from "../../svcs/database/controllers/l2/index.js";

const onSequencerInfoEvent = async (event: ChicmozSequencerEvent) => {
  logger.info(`🔍 SequencerInfo ${JSON.stringify(event)}`);
  await storeL2Sequencer(event.sequencer);
};

export const sequencerInfoHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "sequencerInfoHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "SEQUENCER_INFO_EVENT"),
  cb: onSequencerInfoEvent as (arg0: unknown) => Promise<void>,
};
