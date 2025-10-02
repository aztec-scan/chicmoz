import { startSubscribe } from "../../svcs/message-bus/index.js";

import { l1L2ValidatorHandler } from "./on-l1-l2-validator.js";

export const subscribeHandlers = async () => {
  await Promise.all([
    startSubscribe(l1L2ValidatorHandler),
  ]);
};
