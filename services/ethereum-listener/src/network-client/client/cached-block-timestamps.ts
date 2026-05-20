import { parseTimeStamp } from "@chicmoz-pkg/backend-utils";
import { BLOCK_TIMESTAMP_CACHE_MAX_ENTRIES } from "../../environment.js";

type GetBlockFn = (
  blockNumber: number | bigint,
) => Promise<{ timestamp: bigint }>;

const cache = new Map<string, Promise<number>>();

const evictOldestEntries = () => {
  while (cache.size > BLOCK_TIMESTAMP_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }
    cache.delete(oldestKey);
  }
};

export const getCachedBlockTimestamp = async (
  blockNumber: number | bigint,
  getBlockFn: GetBlockFn,
): Promise<number> => {
  const blockNumberStr = blockNumber.toString();
  const cached = cache.get(blockNumberStr);
  if (cached !== undefined) {
    cache.delete(blockNumberStr);
    cache.set(blockNumberStr, cached);
    return cached;
  }

  const timestampPromise = getBlockFn(blockNumber)
    .then((block) => parseTimeStamp(Number(block.timestamp)))
    .catch((error) => {
      cache.delete(blockNumberStr);
      throw error;
    });
  cache.set(blockNumberStr, timestampPromise);
  evictOldestEntries();
  return timestampPromise;
};
