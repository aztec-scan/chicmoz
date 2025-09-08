import { startSubscribe } from "../../svcs/message-bus/index.js";

import { l1L2ValidatorHandler } from "./on-l1-l2-validator.js";

import { sequencerInfoHandler } from "./on-sequencer-info.js";

export const subscribeHandlers = async () => {
  await Promise.all([
    startSubscribe(sequencerInfoHandler),
    startSubscribe(l1L2ValidatorHandler),
  ]);
};
