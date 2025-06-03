import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  ContractInstanceBalanceEvent,
  generateL2TopicName,
  getConsumerGroupId,
} from "@chicmoz-pkg/message-registry";
import { HexString } from "@chicmoz-pkg/types";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { storeContractInstanceBalance } from "../../svcs/database/controllers/contract-instance-balance/index.js";

const onContractInstanceBalance = async (event: ContractInstanceBalanceEvent) => {
  try {
    await storeContractInstanceBalance({
      contractAddress: event.contractAddress as HexString,
      balance: event.balance,
      timestamp: new Date(event.timestamp),
    });
    
    logger.info(`💰 Processed contract instance balance for ${event.contractAddress}`);
  } catch (error) {
    logger.error(`Error processing contract instance balance for ${event.contractAddress}:`, error);
  }
};

export const contractInstanceBalanceHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "contractInstanceBalanceHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "CONTRACT_INSTANCE_BALANCE_EVENT"),
  cb: onContractInstanceBalance as (arg0: unknown) => Promise<void>,
};
