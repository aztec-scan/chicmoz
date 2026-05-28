import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  generateL1TopicName,
  getConsumerGroupId,
  type L1GovernanceUriResolvedEvent,
} from "@chicmoz-pkg/message-registry";
import {
  ChicmozL1GovernanceSignalCast,
  ChicmozL1GovernancePayloadSubmittable,
  ChicmozL1GovernancePayloadSubmitted,
  ChicmozL1GovernanceProposed,
  ChicmozL1GovernanceVoteCast,
  ChicmozL1GovernanceProposalExecuted,
  ChicmozL1GovernanceProposalDropped,
  ChicmozL1GovernanceConfigUpdated,
  ChicmozL1GovernanceProposerUpdated,
  getL1NetworkId,
} from "@chicmoz-pkg/types";
import { SERVICE_NAME } from "../../constants.js";
import { L2_NETWORK_ID } from "../../environment.js";
import { logger } from "../../logger.js";
import { store } from "../../svcs/database/controllers/l1/governance/index.js";
import { resolvePayloadMetadata } from "../../svcs/metadata-resolver/index.js";

const getLogStr = (
  prefix: string,
  l1BlockNumber: bigint,
  isFinalized: boolean,
  suffix: string,
) => {
  const isFinalizedStr = isFinalized ? "✅" : "💤";
  return `${prefix} l1BlockNumber: ${l1BlockNumber} ${isFinalizedStr} ${suffix}`;
};

// ── Proposed ─────────────────────────────────────────────────────────────────

const onGovernanceProposed = async (event: ChicmozL1GovernanceProposed) => {
  logger.info(
    getLogStr(
      "🏛",
      event.l1BlockNumber,
      event.isFinalized,
      `GovernanceProposed proposalId: ${event.proposalId} uri: ${event.uri}`,
    ),
  );

  // Resolve off-chain metadata
  const metadata = await resolvePayloadMetadata(event.uri);

  // Fetch current governance config to freeze timeline
  // For now, store null config — a follow-up can fetch from Governance.getConfig()
  const configuration = null;

  await store.storeGovernanceProposed(event, metadata, configuration);
};

export const governanceProposedHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceProposedHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_PROPOSED_EVENT",
  ),
  cb: onGovernanceProposed as (arg0: unknown) => Promise<void>,
};

// ── VoteCast ─────────────────────────────────────────────────────────────────

const onGovernanceVoteCast = async (event: ChicmozL1GovernanceVoteCast) => {
  logger.info(
    getLogStr(
      "🗳",
      event.l1BlockNumber,
      event.isFinalized,
      `VoteCast proposalId: ${event.proposalId} voter: ${event.voter} support: ${event.support} amount: ${event.amount}`,
    ),
  );
  await store.storeGovernanceVoteCast(event);
};

export const governanceVoteCastHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceVoteCastHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_VOTE_CAST_EVENT",
  ),
  cb: onGovernanceVoteCast as (arg0: unknown) => Promise<void>,
};

// ── ProposalExecuted ─────────────────────────────────────────────────────────

const onGovernanceProposalExecuted = async (
  event: ChicmozL1GovernanceProposalExecuted,
) => {
  logger.info(
    getLogStr(
      "✅",
      event.l1BlockNumber,
      event.isFinalized,
      `ProposalExecuted proposalId: ${event.proposalId}`,
    ),
  );
  await store.storeGovernanceProposalExecuted(event);
};

export const governanceProposalExecutedHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceProposalExecutedHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_PROPOSAL_EXECUTED_EVENT",
  ),
  cb: onGovernanceProposalExecuted as (arg0: unknown) => Promise<void>,
};

// ── ProposalDropped ──────────────────────────────────────────────────────────

const onGovernanceProposalDropped = async (
  event: ChicmozL1GovernanceProposalDropped,
) => {
  logger.info(
    getLogStr(
      "❌",
      event.l1BlockNumber,
      event.isFinalized,
      `ProposalDropped proposalId: ${event.proposalId}`,
    ),
  );
  await store.storeGovernanceProposalDropped(event);
};

export const governanceProposalDroppedHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceProposalDroppedHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_PROPOSAL_DROPPED_EVENT",
  ),
  cb: onGovernanceProposalDropped as (arg0: unknown) => Promise<void>,
};

// ── SignalCast ───────────────────────────────────────────────────────────────

const onGovernanceSignalCast = async (event: ChicmozL1GovernanceSignalCast) => {
  logger.info(
    getLogStr(
      "📢",
      event.l1BlockNumber,
      event.isFinalized,
      `SignalCast payload: ${event.payloadAddress} round: ${event.round} signaler: ${event.signaler}`,
    ),
  );
  await store.storeGovernanceSignalCast(event);
};

export const governanceSignalCastHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceSignalCastHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_SIGNAL_CAST_EVENT",
  ),
  cb: onGovernanceSignalCast as (arg0: unknown) => Promise<void>,
};

// ── PayloadSubmittable ───────────────────────────────────────────────────────

const onGovernancePayloadSubmittable = async (
  event: ChicmozL1GovernancePayloadSubmittable,
) => {
  logger.info(
    getLogStr(
      "📋",
      event.l1BlockNumber,
      event.isFinalized,
      `PayloadSubmittable payload: ${event.payloadAddress} round: ${event.round}`,
    ),
  );
  await store.storeGovernancePayloadSubmittable(event);
};

export const governancePayloadSubmittableHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governancePayloadSubmittableHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_PAYLOAD_SUBMITTABLE_EVENT",
  ),
  cb: onGovernancePayloadSubmittable as (arg0: unknown) => Promise<void>,
};

// ── PayloadSubmitted ─────────────────────────────────────────────────────────

const onGovernancePayloadSubmitted = async (
  event: ChicmozL1GovernancePayloadSubmitted,
) => {
  logger.info(
    getLogStr(
      "📤",
      event.l1BlockNumber,
      event.isFinalized,
      `PayloadSubmitted payload: ${event.payloadAddress} round: ${event.round}`,
    ),
  );
  await store.storeGovernancePayloadSubmitted(event);
};

export const governancePayloadSubmittedHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governancePayloadSubmittedHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_PAYLOAD_SUBMITTED_EVENT",
  ),
  cb: onGovernancePayloadSubmitted as (arg0: unknown) => Promise<void>,
};

// ── ConfigUpdated ────────────────────────────────────────────────────────────

const onGovernanceConfigUpdated = async (
  event: ChicmozL1GovernanceConfigUpdated,
) => {
  logger.info(
    getLogStr(
      "⚙",
      event.l1BlockNumber,
      event.isFinalized,
      `GovernanceConfigUpdated`,
    ),
  );
  await store.storeGovernanceConfigUpdated(event);
};

export const governanceConfigUpdatedHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceConfigUpdatedHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_CONFIG_UPDATED_EVENT",
  ),
  cb: onGovernanceConfigUpdated as (arg0: unknown) => Promise<void>,
};

// ── ProposerUpdated ──────────────────────────────────────────────────────────

const onGovernanceProposerUpdated = async (
  event: ChicmozL1GovernanceProposerUpdated,
) => {
  logger.info(
    getLogStr(
      "🔄",
      event.l1BlockNumber,
      event.isFinalized,
      `GovernanceProposerUpdated address: ${event.governanceProposerAddress}`,
    ),
  );
  await store.storeGovernanceProposerUpdated(event);
};

export const governanceProposerUpdatedHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceProposerUpdatedHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_PROPOSER_UPDATED_EVENT",
  ),
  cb: onGovernanceProposerUpdated as (arg0: unknown) => Promise<void>,
};

// ── URI backfill ─────────────────────────────────────────────────────────────

const onGovernanceUriResolved = async (
  event: L1GovernanceUriResolvedEvent,
) => {
  logger.info(
    `Governance URI resolved proposalId: ${event.proposalId} hasUri: ${event.uri !== null}`,
  );

  if (event.uri === null) {
    if (event.error) {
      logger.warn(
        `Governance URI backfill failed proposalId: ${event.proposalId} error: ${event.error}`,
      );
    }
    return;
  }

  const metadata = await resolvePayloadMetadata(event.uri);
  await store.updateGovernanceProposalUri({
    proposalId: event.proposalId,
    uri: event.uri,
    metadata,
  });
};

export const governanceUriResolvedHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: SERVICE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "governanceUriResolvedHandler",
  }),
  topic: generateL1TopicName(
    L2_NETWORK_ID,
    getL1NetworkId(L2_NETWORK_ID),
    "L1_GOVERNANCE_URI_RESOLVED_EVENT",
  ),
  cb: onGovernanceUriResolved as (arg0: unknown) => Promise<void>,
};
