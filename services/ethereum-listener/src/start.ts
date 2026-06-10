import { handlers } from "./events/index.js";
import { startSubscribe } from "./svcs/message-bus/index.js";

export const start = async () => {
  await Promise.all([
    startSubscribe(handlers.connectedToAztec),
    startSubscribe(handlers.governanceUriRequestHandler),
  ]);
};
