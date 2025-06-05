import { ChicmozL2RpcNode } from "@chicmoz-pkg/types";
import Bottleneck from "bottleneck";
import { logger } from "../../logger.js";
import { publishMessage } from "../../svcs/message-bus/index.js";

const publishBottlenecks: Record<string, Bottleneck> = {};
const bottleneckOpts: Bottleneck.ConstructorOptions = {
  maxConcurrent: 1,
  minTime: 5000,
  highWater: 1,
  strategy: Bottleneck.strategy.LEAK,
};

export const onL2RpcNodeAlive = (
  rpcUrl: ChicmozL2RpcNode["rpcUrl"],
  rpcName: string,
) => {
  const event = { rpcName, rpcUrl, timestamp: new Date().getTime() };
  if (!publishBottlenecks[rpcUrl]) {
    publishBottlenecks[rpcUrl] = new Bottleneck(bottleneckOpts);
  }

  publishBottlenecks[rpcUrl]
    .schedule(async () => {
      await publishMessage("L2_RPC_NODE_ALIVE_EVENT", event);
    })
    .catch((e) => {
      if (e instanceof Bottleneck.BottleneckError) {
        logger.debug(`✔ onL2RpcNodeAlive on bottleneck error: ${e.message}`);
      } else {
        logger.warn(
          `✔ onL2RpcNodeAlive on publish error: ${(e as Error).message}`,
        );
      }
    });
};
