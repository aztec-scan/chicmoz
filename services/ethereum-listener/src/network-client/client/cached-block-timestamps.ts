import { getBlock } from "./index.js";
import { parseTimeStamp } from "@chicmoz-pkg/backend-utils";


const cache: Record<string, Promise<number>> = {};

export const getCachedBlockTimestamp = async (
  blockNumber: number | bigint,
  getBlockFn: typeof getBlock,
): Promise<number> => {
  const blockNumberStr = blockNumber.toString();
  if (cache[blockNumberStr] !== undefined) {
    return cache[blockNumberStr];
  }
  cache[blockNumberStr] = getBlockFn(blockNumber).then((block) => {
    const timestamp = parseTimeStamp(Number(block.timestamp));
    return timestamp;
  });
  return cache[blockNumberStr];
};
