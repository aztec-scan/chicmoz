import { ChicmozChainInfo } from "@chicmoz-pkg/types";
import { logger } from "../../../../../logger.js";
import { getLatestRollupVersion as getLatestRollupVersionDb } from "./get.js";

// TODO: This should maybe use Redis for caching instead of in-memory.

let highestRollupVersion: ChicmozChainInfo["rollupVersion"] | null = null;

export function onRollupVersion(
  rollupVersion: ChicmozChainInfo["rollupVersion"],
): void {
  if (highestRollupVersion === null) {
    highestRollupVersion = rollupVersion;
    return;
  }
  highestRollupVersion =
    highestRollupVersion > rollupVersion ? highestRollupVersion : rollupVersion;
}

export async function getLatestRollupVersion(): Promise<
  ChicmozChainInfo["rollupVersion"]
> {
  if (highestRollupVersion === null) {
    const latestDbVersion = await getLatestRollupVersionDb();
    if (latestDbVersion === null) {
      throw new Error("No rollup version found in the database");
    }
    highestRollupVersion = latestDbVersion;
  }
  return highestRollupVersion;
}

export async function initializeRollupVersionCache(): Promise<void> {
  try {
    await getLatestRollupVersion();
  } catch (error) {
    logger.warn("Rollup version cache initializing with no data");
  }
}
