import { chicmozL1GenericContractEventSchema } from "@chicmoz-pkg/types";
import { type Log } from "viem";
import { GENERIC_EVENT_DEDUP_MAX_ENTRIES } from "../../../environment.js";
import { emit } from "../../../events/index.js";
import { logger } from "../../../logger.js";
import { getBlockTimestamp } from "../../client/index.js";

export * from "./rollup.js";

export const asyncForEach = async <T>(
  array: T[],
  callback: (value: T) => Promise<void>,
) => {
  for (const item of array) {
    await callback(item);
  }
};

export type onLogsLogs = (Log & {
  eventName: string | null;
  args: Record<string, unknown> | null;
})[];

const seenGenericLogKeys = new Map<string, true>();

const rememberGenericLogKey = (key: string) => {
  seenGenericLogKeys.set(key, true);
  while (seenGenericLogKeys.size > GENERIC_EVENT_DEDUP_MAX_ENTRIES) {
    const oldestKey = seenGenericLogKeys.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }
    seenGenericLogKeys.delete(oldestKey);
  }
};

const getGenericLogKey = ({
  log,
  isFinalized,
}: {
  log: onLogsLogs[number];
  isFinalized: boolean;
}) =>
  [
    isFinalized ? "finalized" : "pending",
    log.address,
    log.eventName ?? "unknown",
    log.blockHash,
    log.transactionHash,
    log.logIndex?.toString() ?? "unknown",
  ].join(":");

export const genericOnLogs = async ({
  logs,
  updateHeight,
  storeHeight,
  isFinalized,
}: {
  logs: onLogsLogs;
  updateHeight: (newHeight: bigint) => void;
  storeHeight: () => Promise<void>;
  isFinalized: boolean;
}) => {
  await asyncForEach(logs, async (log) => {
    if ("removed" in log && log.removed === true) {
      return;
    }
    const logKey = getGenericLogKey({ log, isFinalized });
    if (seenGenericLogKeys.has(logKey)) {
      return;
    }

    await emit.genericContractEvent(
      chicmozL1GenericContractEventSchema.parse({
        l1BlockNumber: log.blockNumber,
        l1BlockHash: log.blockHash,
        l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
        l1ContractAddress: log.address,
        l1TransactionHash: log.transactionHash,
        l1LogIndex: log.logIndex,
        isFinalized,
        eventName: log.eventName,
        eventArgs: log.args,
      }),
    );
    rememberGenericLogKey(logKey);
    if (log.blockNumber) {
      updateHeight(log.blockNumber);
    }
  });
  await storeHeight();
};

export const genericOnError = ({
  e,
  name,
  eventName,
}: {
  e: Error;
  name: string;
  eventName: string;
}) => {
  logger.error(`🍔🥓 ${name}.${eventName}: ${e.stack}`);
};
