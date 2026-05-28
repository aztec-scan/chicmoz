import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  generateL1TopicName,
  getConsumerGroupId,
  type L1GovernanceUriRequestEvent,
} from "@chicmoz-pkg/message-registry";
import { getL1NetworkId } from "@chicmoz-pkg/types";
import Bottleneck from "bottleneck";
import { isAddress } from "viem";
import { SERVICE_NAME } from "../../constants.js";
import {
  L1_GOVERNANCE_URI_REQUEST_MAX_AGE_MS,
  L1_GOVERNANCE_URI_REQUEST_MAX_PROPOSALS,
  L1_GOVERNANCE_URI_REQUEST_QUEUE_HIGH_WATER,
  L1_GOVERNANCE_URI_REQUEST_QUEUE_MIN_TIME_MS,
  L2_NETWORK_ID,
} from "../../environment.js";
import { logger } from "../../logger.js";
import { resolvePayloadUri } from "../../network-client/contracts/callbacks/governance.js";
import { emit } from "../index.js";

const inFlightRequests = new Set<string>();

const requestLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: L1_GOVERNANCE_URI_REQUEST_QUEUE_MIN_TIME_MS,
  highWater: L1_GOVERNANCE_URI_REQUEST_QUEUE_HIGH_WATER,
  strategy: Bottleneck.strategy.LEAK,
});

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const getGovernanceUriRequestDedupKey = (
  event: L1GovernanceUriRequestEvent,
) =>
  `${L2_NETWORK_ID}:${event.reason}:${event.proposals
    .map((proposal) => `${proposal.proposalId}-${proposal.proposalAddress}`)
    .join(",")}`;

const processGovernanceUriRequest = async (
  event: L1GovernanceUriRequestEvent,
) => {
  const requestAgeMs = Date.now() - event.requestedAt;
  if (requestAgeMs > L1_GOVERNANCE_URI_REQUEST_MAX_AGE_MS) {
    logger.warn(
      `Skipping stale governance URI request ${event.requestId}; ageMs=${requestAgeMs}`,
    );
    return;
  }

  const proposals = event.proposals.slice(
    0,
    Math.min(
      event.maxProposals ?? L1_GOVERNANCE_URI_REQUEST_MAX_PROPOSALS,
      L1_GOVERNANCE_URI_REQUEST_MAX_PROPOSALS,
    ),
  );
  const startedAt = Date.now();
  let resolvedCount = 0;
  let failedCount = 0;

  logger.info(
    `Processing governance URI request ${event.requestId}; reason=${event.reason}; requestedProposals=${event.proposals.length}; cappedProposals=${proposals.length}`,
  );

  for (const proposal of proposals) {
    if (!isAddress(proposal.proposalAddress)) {
      failedCount++;
      await emit.governanceUriResolved({
        requestId: event.requestId,
        proposalId: proposal.proposalId,
        proposalAddress: proposal.proposalAddress,
        uri: null,
        resolvedAt: Date.now(),
        error: `Invalid proposal address: ${proposal.proposalAddress}`,
      });
      continue;
    }

    try {
      const uri = await resolvePayloadUri(
        proposal.proposalAddress,
        BigInt(proposal.l1BlockNumber),
      );
      if (uri === null) {
        failedCount++;
      } else {
        resolvedCount++;
      }
      await emit.governanceUriResolved({
        requestId: event.requestId,
        proposalId: proposal.proposalId,
        proposalAddress: proposal.proposalAddress,
        uri,
        resolvedAt: Date.now(),
      });
    } catch (error) {
      failedCount++;
      await emit.governanceUriResolved({
        requestId: event.requestId,
        proposalId: proposal.proposalId,
        proposalAddress: proposal.proposalAddress,
        uri: null,
        resolvedAt: Date.now(),
        error: formatError(error),
      });
    }
  }

  logger.info(
    `Fulfilled governance URI request ${event.requestId}; resolved=${resolvedCount}; failed=${failedCount}; latencyMs=${Date.now() - startedAt}`,
  );
};

const onGovernanceUriRequest = async (event: L1GovernanceUriRequestEvent) => {
  const dedupKey = getGovernanceUriRequestDedupKey(event);
  if (inFlightRequests.has(dedupKey)) {
    logger.info(
      `Deduped in-flight governance URI request ${event.requestId}; key=${dedupKey}`,
    );
    return;
  }

  inFlightRequests.add(dedupKey);
  try {
    await requestLimiter.schedule(() => processGovernanceUriRequest(event));
  } catch (error) {
    if (error instanceof Bottleneck.BottleneckError) {
      logger.warn(
        `Skipped queued governance URI request ${event.requestId}: ${error.message}`,
      );
    } else {
      throw error;
    }
  } finally {
    inFlightRequests.delete(dedupKey);
  }
};

export const governanceUriRequestHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceUriRequestHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_URI_REQUEST_EVENT",
  ),
  cb: onGovernanceUriRequest as (arg0: unknown) => Promise<void>,
};
