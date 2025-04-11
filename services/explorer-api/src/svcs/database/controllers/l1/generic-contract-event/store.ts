import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozL1GenericContractEvent } from "@chicmoz-pkg/types";
import { l1GenericContractEventTable } from "../../../schema/l1/generic-contract-event.js";

export const store = async (contractEvent: ChicmozL1GenericContractEvent) => {
  if (!contractEvent.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp");
  }
  return await db()
    .insert(l1GenericContractEventTable)
    .values({
      l1BlockHash: contractEvent.l1BlockHash,
      l1BlockNumber: contractEvent.l1BlockNumber,
      l1BlockTimestamp: contractEvent.l1BlockTimestamp,
      l1ContractAddress: contractEvent.l1ContractAddress,
      l1TransactionHash: contractEvent.l1TransactionHash,
      eventName: contractEvent.eventName,
      eventArgs: contractEvent.eventArgs,
    })
    .onConflictDoNothing();
};
