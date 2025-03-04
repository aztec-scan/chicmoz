import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { and, eq, getTableColumns } from "drizzle-orm";
import { logger } from "../../../logger.js";
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
  const lastProcessedHeight = isFinalized
    ? latestFinalizedHeight
    : latestPendingHeight;
  let height = lastProcessedHeight;
  const finalizedString = isFinalized ? "✅" : "💤";
  logger.info(
    `START ${lastProcessedHeight} ${finalizedString} ${contractName} ${eventName}`,
  );
  const updateMemory = (newHeight: bigint) => {
    if (newHeight > height) {
      height = newHeight;
    }
  };
  const updateDb = async () => {
    logger.info(
      `END   ${height} ${finalizedString} ${contractName} ${eventName}`,
    );
    await setHeight({
      contractName,
      contractAddress,
      eventName,
      hight: height,
      isFinalized,
    });
  };
  return {
    updateHeight: updateMemory,
    storeHeight: updateDb,
    fromBlock: lastProcessedHeight + 1n,
  };
};

export const setHeight = async ({
  contractName,
  contractAddress,
  eventName,
  hight: height,
  isFinalized,
}: {
  contractName: string;
  contractAddress: string;
  eventName: string;
  hight: bigint;
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
    return {
      latestPendingHeight: latestHeight ?? 0n,
      latestFinalizedHeight: latestHeight ?? 0n,
    };
  }

  return res[0];
};
