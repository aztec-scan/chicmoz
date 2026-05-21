import { startSubscribe } from "../../svcs/message-bus/index.js";
import { l2BlockRangeRequestHandler } from "./on-l2-block-range-request.js";

export const subscribeHandlers = async () => {
  await Promise.all([startSubscribe(l2BlockRangeRequestHandler)]);
};
