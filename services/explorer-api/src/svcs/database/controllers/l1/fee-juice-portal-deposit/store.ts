import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { type ChicmozL1FeeJuicePortalDeposit } from "@chicmoz-pkg/types";
import { l1FeeJuicePortalDepositTable } from "../../../schema/l1/fee-juice-portal-deposit.js";

export const store = async (deposit: ChicmozL1FeeJuicePortalDeposit) => {
  if (!deposit.l1BlockTimestamp) {
    throw new Error("Missing l1BlockTimestamp on FeeJuicePortal deposit");
  }
  const l1LogIndex: number | null =
    deposit.l1LogIndex === undefined || deposit.l1LogIndex === null
      ? null
      : Number(deposit.l1LogIndex);

  return await db()
    .insert(l1FeeJuicePortalDepositTable)
    .values({
      l1BlockNumber: deposit.l1BlockNumber,
      l1BlockHash: deposit.l1BlockHash,
      l1BlockTimestamp: deposit.l1BlockTimestamp,
      l1ContractAddress: deposit.l1ContractAddress,
      l1TransactionHash: deposit.l1TransactionHash,
      l1LogIndex,
      isFinalized: deposit.isFinalized,
      to: deposit.to,
      amount: deposit.amount,
      secretHash: deposit.secretHash,
      key: deposit.key,
      index: deposit.index,
    })
    .onConflictDoNothing({
      target: [
        l1FeeJuicePortalDepositTable.l1TransactionHash,
        l1FeeJuicePortalDepositTable.l1LogIndex,
        l1FeeJuicePortalDepositTable.l1ContractAddress,
        l1FeeJuicePortalDepositTable.isFinalized,
      ],
    });
};
