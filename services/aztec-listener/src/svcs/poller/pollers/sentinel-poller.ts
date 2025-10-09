
import { ValidatorStats } from "@aztec/stdlib/validators"
import { SentinelActivity, sentinelValidatorStatsSchema, SentinelValidatorStats, SentinelHistory } from "@chicmoz-pkg/types";
import { parseTimeStamp } from "@chicmoz-pkg/backend-utils"

import { SENTINEL_POLL_INTERVAL_MS } from "../../../environment.js";
import { onL2SentinelHistory, onL2SentinelInfo } from "../../../events/emitted/sentinel.js";

import { logger } from "../../../logger.js";
import { getSentinelInfo } from "../network-client/index.js";
import { getLastProcessedSlot, storeLastProcessedSlot } from "../../database/slots.controller.js";

let pollInterval: NodeJS.Timeout;

const pickLatestActivity = (
  a?: { timestamp: bigint; slot: bigint; date: string },
  b?: { timestamp: bigint; slot: bigint; date: string }
) =>  {
  if (!a && !b) {return undefined;}
  if (!a) {return b;}
  if (!b) {return a;}

  return Number(a.slot) > Number(b.slot) ? a : b;
}

const parseSentinelValidatorResponse = (sentinelValidator: ValidatorStats) => {

  const { address, totalSlots, missedProposals, missedAttestations, history, lastProposal, lastAttestation } = sentinelValidator

  const attestations: SentinelActivity = {
    total: missedAttestations.total,
    missed: missedAttestations.count,
  }

  if (lastAttestation){
    attestations.lastSeenAt = parseTimeStamp(Number(lastAttestation.timestamp))
    attestations.lastSeenAtSlot = lastAttestation.slot
  }

  const blocks: SentinelActivity= {
    total: missedProposals.total,
    missed: missedProposals.count,
  }

  if (lastProposal){
    blocks.lastSeenAt = parseTimeStamp(Number(lastProposal.timestamp))
    blocks.lastSeenAtSlot = lastProposal.slot
  }

  const validator:SentinelValidatorStats = {
    attester: address.toString(),
    history: history,
    attestations: attestations,
    blocks: blocks,
    totalSlots: totalSlots,
  }

  const latest = pickLatestActivity(lastProposal, lastAttestation)
  if (latest) {
    validator.lastSeenAtSlot = latest.slot
    validator.lastSeenAt = parseTimeStamp(Number(latest.timestamp))
  }


  return sentinelValidatorStatsSchema.parse(validator)

}

const filterSentinelStats = (sentinelStats: SentinelValidatorStats[], lastProcessedSlot: bigint) => {
  return sentinelStats.filter((validatorStats: SentinelValidatorStats) => {
    if (validatorStats.totalSlots == 0) {return false}

    validatorStats.history = validatorStats.history.filter(({ slot }: SentinelHistory) => slot > lastProcessedSlot)

    if (validatorStats.history.length > 0) {return true}

    return false
  })
}


export const startPolling = () => {
  pollInterval = setInterval(() => {
    void fetchAndPublishSentinelInfo();
  }, SENTINEL_POLL_INTERVAL_MS);
};

export const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
};

const publishSentinelValidatorStats = async (validatorStats: SentinelValidatorStats) => {
  // TODO: Maybe handle this better
  await Promise.all(validatorStats.history.map((validatorHistoryEntry: SentinelHistory) => onL2SentinelHistory(validatorStats.attester, validatorHistoryEntry)))

  const validatorStatsCopy: SentinelValidatorStats = { ...validatorStats, history: [] };
  await onL2SentinelInfo(validatorStatsCopy)
}

const fetchAndPublishSentinelInfo = async () => {
  try {
    // If this whole thing gets waaaay to big with this 20-30k validators might need to look at a way to look at the l1 contract and only fetch those individually
    const sentinelInfo = await getSentinelInfo();
    const lastProcessedSlot = await getLastProcessedSlot()
    if (sentinelInfo.lastProcessedSlot && sentinelInfo.lastProcessedSlot > lastProcessedSlot) {
      //TODO: Handle this
      logger.warn("Error encountered a reorg in sentinel")
    } 
    const parsedSentinelStats = Object.values(sentinelInfo.stats).map((sentinelStats: ValidatorStats) => parseSentinelValidatorResponse(sentinelStats))

    const filteredSentinelStats = filterSentinelStats(parsedSentinelStats, lastProcessedSlot)
    await Promise.all(filteredSentinelStats.map((validatorStats: SentinelValidatorStats) => publishSentinelValidatorStats(validatorStats)))

    await storeLastProcessedSlot(sentinelInfo.lastProcessedSlot!) // Can probably get away with ! here as it seems to always be returned
  } catch (error) {
    logger.warn("Error fetching sentinel info", error);
  }
};
