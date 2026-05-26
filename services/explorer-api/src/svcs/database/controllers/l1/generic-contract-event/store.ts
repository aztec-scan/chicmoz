import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozL1GenericContractEvent } from "@chicmoz-pkg/types";
import { l1GenericContractEventTable } from "../../../schema/l1/generic-contract-event.js";

export const store = async (contractEvent: ChicmozL1GenericContractEvent) => {
  if (!contractEvent.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }
  const l1LogIndex: number | null =
    contractEvent.l1LogIndex === undefined || contractEvent.l1LogIndex === null
      ? null
      : Number(contractEvent.l1LogIndex);
  return await db()
    .insert(l1GenericContractEventTable)
    .values({
      l1BlockHash: contractEvent.l1BlockHash,
      l1BlockNumber: contractEvent.l1BlockNumber,
      l1BlockTimestamp: contractEvent.l1BlockTimestamp,
      l1ContractAddress: contractEvent.l1ContractAddress,
      l1TransactionHash: contractEvent.l1TransactionHash,
      l1LogIndex,
      isFinalized: contractEvent.isFinalized,
      eventName: contractEvent.eventName,
      eventArgs: contractEvent.eventArgs,
    })
    .onConflictDoNothing({
      target: [
        l1GenericContractEventTable.l1TransactionHash,
        l1GenericContractEventTable.l1LogIndex,
        l1GenericContractEventTable.l1ContractAddress,
        l1GenericContractEventTable.isFinalized,
      ],
    });
};
