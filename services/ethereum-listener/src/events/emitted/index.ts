import { type L1GovernanceUriResolvedEvent } from "@chicmoz-pkg/message-registry";
import {
  ChicmozL1FeeJuicePortalDeposit,
  ChicmozL1GenericContractEvent,
  ChicmozL1L2BlockProposed,
  ChicmozL1L2ProofVerified,
  ChicmozL1L2Validator,
  ChicmozL1GovernanceSignalCast,
  ChicmozL1GovernancePayloadSubmittable,
  ChicmozL1GovernancePayloadSubmitted,
  ChicmozL1GovernanceProposed,
  ChicmozL1GovernanceVoteCast,
  ChicmozL1GovernanceProposalExecuted,
  ChicmozL1GovernanceProposalDropped,
  ChicmozL1GovernanceConfigUpdated,
  ChicmozL1GovernanceProposerUpdated,
  type ChicmozChainInfo,
} from "@chicmoz-pkg/types";
import { publishMessage } from "../../svcs/message-bus/index.js";

type StakingAssetInfoEvent = {
  chainInfo: ChicmozChainInfo & {
    stakingAssetSymbol?: string;
    stakingAssetDecimals?: number;
    feeJuiceSymbol?: string;
    feeJuiceDecimals?: number;
  };
};

const bigintString = (value: bigint | null | undefined) =>
  value === null || value === undefined
    ? undefined
    : (value.toString() as unknown as bigint);

const governanceConfigurationForMessage = (
  configuration: ChicmozL1GovernanceProposed["configuration"],
) =>
  configuration === null || configuration === undefined
    ? configuration
    : Object.fromEntries(
        Object.entries(configuration).map(([key, value]) => [
          key,
          value.toString(),
        ]),
      ) as unknown as ChicmozL1GovernanceProposed["configuration"];

const stringifyBigInts = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifyBigInts(item));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, stringifyBigInts(entry)]),
    );
  }
  return value;
};

export const l1Validator = async (validators: ChicmozL1L2Validator[]) => {
  const objsToSend = validators.map((validator) => ({
    ...validator,
    stake: validator.stake.toString(),
  }));
  await publishMessage("L1_L2_VALIDATOR_EVENT", { validators: objsToSend });
};

export const l2BlockProposed = async (
  blockProposed: ChicmozL1L2BlockProposed,
) => {
  await publishMessage("L1_L2_BLOCK_PROPOSED_EVENT", {
    ...blockProposed,
    l2BlockNumber: blockProposed.l2BlockNumber.toString() as unknown as bigint,
    l1BlockNumber: blockProposed.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const l2ProofVerified = async (
  proofVerified: ChicmozL1L2ProofVerified,
) => {
  await publishMessage("L1_L2_PROOF_VERIFIED_EVENT", {
    ...proofVerified,
    l2BlockNumber: proofVerified.l2BlockNumber.toString() as unknown as bigint,
    l1BlockNumber: proofVerified.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const genericContractEvent = async (
  genericContractEvent: ChicmozL1GenericContractEvent,
) => {
  await publishMessage("L1_GENERIC_CONTRACT_EVENT", genericContractEvent);
};

export const stakingAssetInfo = async (event: StakingAssetInfoEvent) => {
  await publishMessage(
    "STAKING_ASSET_INFO_EVENT" as Parameters<typeof publishMessage>[0],
    event,
  );
};

export const feeJuicePortalDeposit = async (
  deposit: ChicmozL1FeeJuicePortalDeposit,
) => {
  await publishMessage("L1_FEE_JUICE_PORTAL_DEPOSIT_EVENT", {
    ...deposit,
    amount: deposit.amount.toString() as unknown as bigint,
    index: deposit.index.toString() as unknown as bigint,
    l1BlockNumber: deposit.l1BlockNumber.toString() as unknown as bigint,
  });
};

// ── Governance emit functions ────────────────────────────────────────────────

export const governanceSignalCast = async (
  event: ChicmozL1GovernanceSignalCast,
) => {
  await publishMessage("L1_GOVERNANCE_SIGNAL_CAST_EVENT", {
    ...event,
    round: event.round.toString() as unknown as bigint,
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governancePayloadSubmittable = async (
  event: ChicmozL1GovernancePayloadSubmittable,
) => {
  await publishMessage("L1_GOVERNANCE_PAYLOAD_SUBMITTABLE_EVENT", {
    ...event,
    round: event.round.toString() as unknown as bigint,
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governancePayloadSubmitted = async (
  event: ChicmozL1GovernancePayloadSubmitted,
) => {
  await publishMessage("L1_GOVERNANCE_PAYLOAD_SUBMITTED_EVENT", {
    ...event,
    round: event.round.toString() as unknown as bigint,
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governanceProposed = async (
  event: ChicmozL1GovernanceProposed,
) => {
  await publishMessage("L1_GOVERNANCE_PROPOSED_EVENT", {
    ...event,
    proposalId: event.proposalId.toString() as unknown as bigint,
    summedYea: bigintString(event.summedYea),
    summedNay: bigintString(event.summedNay),
    snapshotTotalPower: bigintString(event.snapshotTotalPower),
    votesNeeded: bigintString(event.votesNeeded),
    configuration: governanceConfigurationForMessage(event.configuration),
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governanceVoteCast = async (
  event: ChicmozL1GovernanceVoteCast,
) => {
  await publishMessage("L1_GOVERNANCE_VOTE_CAST_EVENT", {
    ...event,
    proposalId: event.proposalId.toString() as unknown as bigint,
    amount: event.amount.toString() as unknown as bigint,
    summedYea: bigintString(event.summedYea),
    summedNay: bigintString(event.summedNay),
    snapshotTotalPower: bigintString(event.snapshotTotalPower),
    votesNeeded: bigintString(event.votesNeeded),
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governanceProposalExecuted = async (
  event: ChicmozL1GovernanceProposalExecuted,
) => {
  await publishMessage("L1_GOVERNANCE_PROPOSAL_EXECUTED_EVENT", {
    ...event,
    proposalId: event.proposalId.toString() as unknown as bigint,
    summedYea: bigintString(event.summedYea),
    summedNay: bigintString(event.summedNay),
    snapshotTotalPower: bigintString(event.snapshotTotalPower),
    votesNeeded: bigintString(event.votesNeeded),
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governanceProposalDropped = async (
  event: ChicmozL1GovernanceProposalDropped,
) => {
  await publishMessage("L1_GOVERNANCE_PROPOSAL_DROPPED_EVENT", {
    ...event,
    proposalId: event.proposalId.toString() as unknown as bigint,
    summedYea: bigintString(event.summedYea),
    summedNay: bigintString(event.summedNay),
    snapshotTotalPower: bigintString(event.snapshotTotalPower),
    votesNeeded: bigintString(event.votesNeeded),
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governanceConfigUpdated = async (
  event: ChicmozL1GovernanceConfigUpdated,
) => {
  await publishMessage("L1_GOVERNANCE_CONFIG_UPDATED_EVENT", {
    ...event,
    configuration: stringifyBigInts(event.configuration) as Record<
      string,
      unknown
    >,
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governanceProposerUpdated = async (
  event: ChicmozL1GovernanceProposerUpdated,
) => {
  await publishMessage("L1_GOVERNANCE_PROPOSER_UPDATED_EVENT", {
    ...event,
    l1BlockNumber: event.l1BlockNumber.toString() as unknown as bigint,
  });
};

export const governanceUriResolved = async (
  event: L1GovernanceUriResolvedEvent,
) => {
  await publishMessage("L1_GOVERNANCE_URI_RESOLVED_EVENT", event);
};
