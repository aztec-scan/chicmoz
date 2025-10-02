import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import {
  ChicmozContractInstanceBalance,
  chicmozContractInstanceBalanceSchema,
  HexString,
 CURRENT_ROLLUP_VERSION } from "@chicmoz-pkg/types";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { contractInstanceBalance } from "../../schema/contract-instance-balance/index.js";
import { l2Block } from "../../schema/index.js";
import { l2ContractInstanceDeployed } from "../../schema/l2contract/index.js";

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

export const getCotractInstacesWithBalance = async (): Promise<
  ChicmozContractInstanceBalance[]
> => {
  const result = await db()
    .selectDistinctOn([contractInstanceBalance.contractAddress], {
      contractAddress: contractInstanceBalance.contractAddress,
      balance: contractInstanceBalance.balance,
      timestamp: contractInstanceBalance.timestamp,
    })
    .from(contractInstanceBalance)
    .innerJoin(
      l2ContractInstanceDeployed,
      eq(
        contractInstanceBalance.contractAddress,
        l2ContractInstanceDeployed.address,
      ),
    )
    .innerJoin(l2Block, eq(l2ContractInstanceDeployed.blockHash, l2Block.hash))
    .where(
      and(
        gt(contractInstanceBalance.balance, "0"),
        isNull(l2Block.orphan_timestamp),
        eq(l2Block.version, parseInt(CURRENT_ROLLUP_VERSION)),
      ),
    )
    .orderBy(
      contractInstanceBalance.contractAddress,
      desc(contractInstanceBalance.timestamp),
    );

  return result.map((row) => chicmozContractInstanceBalanceSchema.parse(row));
};

export const getContractInstanceBalanceHistory = async (
  contractAddress: HexString,
): Promise<ChicmozContractInstanceBalance[]> => {
  const result = await db()
    .select()
    .from(contractInstanceBalance)
    .where(eq(contractInstanceBalance.contractAddress, contractAddress))
    .orderBy(contractInstanceBalance.timestamp)
    .limit(1000);

  return result.map((row) => chicmozContractInstanceBalanceSchema.parse(row));
};
