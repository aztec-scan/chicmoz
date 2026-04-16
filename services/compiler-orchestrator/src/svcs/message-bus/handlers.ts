import {
  startSubscribe as sub,
  type EventHandler,
} from "@chicmoz-pkg/message-bus";
import {
  type CompileSourceRequestEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { L2_NETWORK_ID, SERVICE_NAME } from "../../environment.js";
import { logger } from "../../logger.js";
import { handleCompileRequest } from "../job-manager/index.js";

const onCompileSourceRequest = async (event: CompileSourceRequestEvent) => {
  logger.info(
    `Received compile source request: jobId=${event.jobId} contractClassId=${event.contractClassId}`,
  );
  await handleCompileRequest(event);
};

const compileSourceRequestHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "compileSourceRequestHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "COMPILE_SOURCE_REQUEST_EVENT"),
  cb: onCompileSourceRequest as (arg0: unknown) => Promise<void>,
};

export const subscribeHandlers = async () => {
  await sub(compileSourceRequestHandler, logger);
};
