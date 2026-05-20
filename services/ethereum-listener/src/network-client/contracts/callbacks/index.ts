import { chicmozL1GenericContractEventSchema } from "@chicmoz-pkg/types";
import { Log } from "viem";
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

export const genericOnLogs = async ({
  logs,
  updateHeight,
  storeHeight,
}: {
  logs: onLogsLogs;
  updateHeight: (newHeight: bigint) => void;
  storeHeight: () => Promise<void>;
}) => {
  await asyncForEach(logs, async (log) => {
    await emit.genericContractEvent(
      chicmozL1GenericContractEventSchema.parse({
        l1BlockNumber: log.blockNumber,
        l1BlockHash: log.blockHash,
        l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
        l1ContractAddress: log.address,
        l1TransactionHash: log.transactionHash,
        isFinalized: false,
        eventName: log.eventName,
        eventArgs: log.args,
      }),
    );
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
