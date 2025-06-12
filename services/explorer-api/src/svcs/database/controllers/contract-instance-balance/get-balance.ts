import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozContractInstanceBalance,
  chicmozContractInstanceBalanceSchema,
  HexString,
} from "@chicmoz-pkg/types";
import { desc, eq, gt } from "drizzle-orm";
import { contractInstanceBalance } from "../../schema/contract-instance-balance/index.js";

export const getLatestContractInstanceBalance = async (
  contractAddress: HexString,
): Promise<ChicmozContractInstanceBalance | null> => {
  const result = await db()
    .select()
    .from(contractInstanceBalance)
    .where(eq(contractInstanceBalance.contractAddress, contractAddress))
    .orderBy(desc(contractInstanceBalance.timestamp))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return chicmozContractInstanceBalanceSchema.parse(result[0]);
};

export const getCotractIstacesWithBalance = async (): Promise<
  ChicmozContractInstanceBalance[]
> => {
  const result = await db()
    .selectDistinctOn([contractInstanceBalance.contractAddress])
    .from(contractInstanceBalance)
    .orderBy(
      contractInstanceBalance.contractAddress,
      desc(contractInstanceBalance.timestamp),
    )
    .where(gt(contractInstanceBalance.balance, "0"));

  return result.map((row) => chicmozContractInstanceBalanceSchema.parse(row));
};

export const getContractInstanceBalanceHistory = async (
  contractAddress: HexString,
): Promise<ChicmozContractInstanceBalance[]> => {
  const result = await db()
    .select()
    .from(contractInstanceBalance)
    .where(eq(contractInstanceBalance.contractAddress, contractAddress))
    .orderBy(contractInstanceBalance.timestamp);

  return result.map((row) => chicmozContractInstanceBalanceSchema.parse(row));
};
