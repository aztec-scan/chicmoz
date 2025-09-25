import { ChicmozChainInfo , CURRENT_ROLLUP_VERSION } from "@chicmoz-pkg/types";
import { logger } from "../../../../../logger.js";

// TODO: This should maybe use Redis for caching instead of in-memory.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentRollupVersion: ChicmozChainInfo["rollupVersion"] | null = null;

export function onRollupVersion(
  rollupVersion: ChicmozChainInfo["rollupVersion"],
): void {
  // Only update if it's the current expected version
  if (rollupVersion === BigInt(CURRENT_ROLLUP_VERSION)) {
    currentRollupVersion = rollupVersion;
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function getLatestRollupVersion(): Promise<
  ChicmozChainInfo["rollupVersion"]
> {
  // Always return the current rollup version since version numbers don't increase numerically
  return BigInt(CURRENT_ROLLUP_VERSION);
}

export async function initializeRollupVersionCache(): Promise<void> {
  try {
    currentRollupVersion = await getLatestRollupVersion();
  } catch (error) {
    logger.warn("Rollup version cache initializing with no data");
  }
}
