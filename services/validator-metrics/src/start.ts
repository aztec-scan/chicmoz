import { subscribeHandlers } from "./events/received/index.js";

export const start = async () => {
  await subscribeHandlers();
};
