import { recoverActiveJobs, startJobPoller } from "./svcs/job-manager/index.js";
import { subscribeHandlers } from "./svcs/message-bus/handlers.js";

export const start = async () => {
  await recoverActiveJobs();
  startJobPoller();
  await subscribeHandlers();
};
