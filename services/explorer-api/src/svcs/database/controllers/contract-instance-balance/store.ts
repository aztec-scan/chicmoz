import { ContractInstanceBalanceEvent } from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { bigint } from "zod";
import { logger } from "../../../../logger.js";
import { contractInstanceBalance } from "../../schema/contract-instance-balance/index.js";

export const storeContractInstanceBalance = async (
  data: ContractInstanceBalanceEvent,
): Promise<void> => {
  try {
    await db()
      .insert(contractInstanceBalance)
      .values({
        ...data,
        balance: bigint().parse(data.balance),
      })
      .onConflictDoNothing();

    logger.info(
      `💰 Stored contract instance balance for ${data.contractAddress}: ${data.balance}`,
    );
  } catch (error) {
    logger.error(
      `Error storing contract instance balance for ${data.contractAddress}:`,
      error,
    );
    throw error;
  }
};
