import { subscribeHandlers } from "./events/received/index.js";
import { startPoller } from "./svcs/poller/index.js";

// eslint-disable-next-line @typescript-eslint/require-await
export const start = async () => {
  await subscribeHandlers();
  startPoller();
};
