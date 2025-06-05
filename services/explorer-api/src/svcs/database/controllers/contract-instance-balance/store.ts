import { ContractInstanceBalanceEvent } from "@chicmoz-pkg/message-registry";
import { getDb as db } from "@chicmoz-pkg/postgres-helper";
import { logger } from "../../../../logger.js";
import { contractInstanceBalance } from "../../schema/contract-instance-balance/index.js";

export const storeContractInstanceBalance = async (
  data: ContractInstanceBalanceEvent,
): Promise<void> => {
  await db().insert(contractInstanceBalance).values(data).onConflictDoNothing();

  logger.info(
    `💰 Stored contract instance balance for ${data.contractAddress}: ${data.balance}`,
  );
};
