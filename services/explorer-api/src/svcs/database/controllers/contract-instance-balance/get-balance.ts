import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { ChicmozContractInstanceBalance, HexString } from "@chicmoz-pkg/types";
import { desc, eq } from "drizzle-orm";
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

  return result[0];
};
