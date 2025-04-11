import { getBlock } from "./index.js";

const cache: Record<string, Promise<Date>> = {};

export const getCachedBlockTimestamp = async (
  blockNumber: number | bigint,
  getBlockFn: typeof getBlock,
): Promise<Date> => {
  const blockNumberStr = blockNumber.toString();
  if (cache[blockNumberStr] !== undefined) {
    return cache[blockNumberStr];
  }
  cache[blockNumberStr] = getBlockFn(blockNumber).then((block) => {
    const timestamp = new Date(Number(block.timestamp) * 1000);
    return timestamp;
  });
  return cache[blockNumberStr];
};
