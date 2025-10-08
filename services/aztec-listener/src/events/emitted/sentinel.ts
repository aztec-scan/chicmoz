import { SentinelHistory, SentinelValidatorStats, jsonStringify } from "@chicmoz-pkg/types";
import { logger } from "../../logger.js";
import {
  publishMessage,
} from "../../svcs/message-bus/index.js";

export const onL2SentinelInfo = async (validatorStats: SentinelValidatorStats) => {
  const event = { validatorStats };
  logger.info(`🔍 publishing SENTINEL_INFO_EVENT ${jsonStringify(event)}`);
  await publishMessage("SENTINEL_INFO_EVENT", event);
};

export const onL2SentinelHistory = async (attester: string, sentinelHistoryEntry: SentinelHistory) => {
  const event = { sentinelHistoryEntry, attester };
  logger.info(`🔍 publishing SENTINEL_INFO_EVENT ${jsonStringify(event)}`);
  await publishMessage("SENTINEL_HISTORY_EVENT", event);
};
