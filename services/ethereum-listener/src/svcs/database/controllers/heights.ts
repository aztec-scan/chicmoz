import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, eq, getTableColumns } from "drizzle-orm";
import { logger } from "../../../logger.js";
import { getEarliestRollupBlockNumber } from "../../../network-client/client/index.js";
import { heightsTable } from "../schema.js";

export type PartialDbError = {
  code: string;
  detail: string;
};

export const inMemoryHeightTracker = async ({
  contractAddress,
  contractName,
  eventName,
  isFinalized,
  latestHeight,
}: {
  contractAddress: string;
  contractName: string;
  eventName: string;
  isFinalized: boolean;
  latestHeight: bigint;
}) => {
  const { latestPendingHeight, latestFinalizedHeight } = await getHeights({
    contractName,
    contractAddress,
    eventName,
    latestHeight,
  });
  let overrideStoreHeight: bigint | undefined;
  const setOverrideStoreHeight = (height: bigint) => {
    overrideStoreHeight = height;
  };

  const lastProcessedHeight = isFinalized
    ? latestFinalizedHeight
    : latestPendingHeight;

  const genesisBlock = await getEarliestRollupBlockNumber();
  let memoryHeight =
    lastProcessedHeight < genesisBlock ? genesisBlock : lastProcessedHeight;
  const finalizedString = isFinalized ? "✅" : "💤";
  logger.info(
    `START ${lastProcessedHeight} ${finalizedString} ${contractName} ${eventName}`,
  );
  const updateMemory = (newHeight: bigint) => {
    if (newHeight > memoryHeight) {
      memoryHeight = newHeight;
    }
  };
  const getMemoryHeight = () => memoryHeight;

  const updateDb = async () => {
    logger.info(
      `END   ${memoryHeight} ${finalizedString} ${contractName} ${eventName}`,
    );
    await setHeight({
      contractName,
      contractAddress,
      eventName,
      height: overrideStoreHeight ?? memoryHeight,
      isFinalized,
    });
  };
  return {
    updateHeight: updateMemory,
    storeHeight: updateDb,
    fromBlock: lastProcessedHeight + 1n,
    getMemoryHeight,
    setOverrideStoreHeight,
  };
};

export const setHeight = async ({
  contractName,
  contractAddress,
  eventName,
  height,
  isFinalized,
}: {
  contractName: string;
  contractAddress: string;
  eventName: string;
  height: bigint;
  isFinalized: boolean;
}) => {
  const update = isFinalized
    ? {
        latestFinalizedHeight: height,
        finalizedHeightLastUpdated: new Date(),
      }
    : {
        latestPendingHeight: height,
        pendingHeightLastUpdated: new Date(),
      };
  const updateRes = await db()
    .update(heightsTable)
    .set(update)
    .where(
      and(
        eq(heightsTable.contractName, contractName),
        eq(heightsTable.contractAddress, contractAddress),
        eq(heightsTable.eventName, eventName),
      ),
    )
    .returning();
  if (!updateRes.length) {
    await db()
      .insert(heightsTable)
      .values({
        contractName,
        contractAddress,
        eventName,
        ...update,
      });
  }
};

let earliestBlockNumberRes: Promise<bigint> | undefined;

export const getHeights = async ({
  contractName,
  contractAddress,
  eventName,
  latestHeight,
}: {
  contractName: string;
  contractAddress: string;
  eventName: string;
  latestHeight: bigint;
}) => {
  const res = await db()
    .select(getTableColumns(heightsTable))
    .from(heightsTable)
    .where(
      and(
        eq(heightsTable.contractName, contractName),
        eq(heightsTable.contractAddress, contractAddress),
        eq(heightsTable.eventName, eventName),
      ),
    )
    .limit(1);
  if (!res.length) {
    if (!earliestBlockNumberRes) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      earliestBlockNumberRes = getEarliestRollupBlockNumber();
    }
    const earliestBlockNumber = await earliestBlockNumberRes;
    return {
      latestPendingHeight: latestHeight ?? earliestBlockNumber,
      latestFinalizedHeight: earliestBlockNumber,
    };
  }

  return res[0];
};
