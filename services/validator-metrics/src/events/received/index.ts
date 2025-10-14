import { startSubscribe } from "../../svcs/message-bus/index.js";

import { l1L2ValidatorHandler } from "./on-l1-l2-validator.js";
import {
  sentinelHistoryHandler,
  sentinelInfoHandler,
} from "./on-sentinel-info.js";

export const subscribeHandlers = async () => {
  await Promise.all([
    startSubscribe(l1L2ValidatorHandler),
    startSubscribe(sentinelInfoHandler),
    startSubscribe(sentinelHistoryHandler),
  ]);
};
