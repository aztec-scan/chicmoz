import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { HexString } from "@chicmoz-pkg/types";
import { logger } from "../../../../logger.js";
import { contractInstanceBalance } from "../../schema/contract-instance-balance/index.js";

export interface ContractInstanceBalanceData {
  contractAddress: HexString;
  balance: string;
  timestamp: Date;
}

export const storeContractInstanceBalance = async (
  data: ContractInstanceBalanceData
): Promise<void> => {
  try {
    await db()
      .insert(contractInstanceBalance)
      .values({
        contractAddress: data.contractAddress,
        balance: data.balance,
        timestamp: data.timestamp,
      });
    
    logger.info(`💰 Stored contract instance balance for ${data.contractAddress}: ${data.balance}`);
  } catch (error) {
    logger.error(`Error storing contract instance balance for ${data.contractAddress}:`, error);
    throw error;
  }
};
