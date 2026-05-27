import {
  chicmozL1GovernancePayloadSubmittableSchema,
  chicmozL1GovernancePayloadSubmittedSchema,
  chicmozL1GovernanceProposalDroppedSchema,
  chicmozL1GovernanceProposalExecutedSchema,
  chicmozL1GovernanceProposedSchema,
  chicmozL1GovernanceSignalCastSchema,
  chicmozL1GovernanceVoteCastSchema,
} from "@chicmoz-pkg/types";
import { getPublicHttpClient , getBlockTimestamp } from "../../client/index.js";
import { emit } from "../../../events/index.js";
import { logger } from "../../../logger.js";
import { asyncForEach } from "./index.js";

const onError = (name: string) => (e: Error) => {
  logger.error(`${name}: ${e.stack}`);
};

type OnLogsCallbackWrapperArgs = {
  isFinalized: boolean;
  updateHeight: (height: bigint) => void;
  storeHeight: () => Promise<void>;
};

// ── Governance (formal proposal) callbacks ──────────────────────────────────

type ProposedGetEventsResult = Awaited<
  ReturnType<import("../utils.js").GovernanceContract["getEvents"]["Proposed"]>
>;

const proposedOnLogs =
  (wrapperArgs: OnLogsCallbackWrapperArgs) =>
  async (logs: ProposedGetEventsResult) => {
    await asyncForEach(logs, async (log) => {
      if (log.args.proposal === undefined) {
        throw new Error("Proposed event: proposal address is undefined");
      }

      // Fetch URI from the payload contract via eth_call at the event's block
      let uri: string | null = null;
      try {
        uri = (await getPublicHttpClient().readContract({
          address: log.args.proposal,
          abi: [
            {
              type: "function",
              name: "getURI",
              inputs: [],
              outputs: [{ type: "string", name: "" }],
              stateMutability: "view",
            },
          ],
          functionName: "getURI",
          blockNumber: log.blockNumber,
        }));
      } catch {
        logger.warn(
          `Failed to fetch URI for payload ${log.args.proposal} at block ${log.blockNumber}`,
        );
      }

      await emit.governanceProposed(
        chicmozL1GovernanceProposedSchema.parse({
          proposalId: log.args.proposalId,
          proposalAddress: log.args.proposal,
          uri: uri ?? null,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          l1TransactionHash: log.transactionHash,
          l1LogIndex: log.logIndex,
          isFinalized: wrapperArgs.isFinalized,
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    });
    await wrapperArgs.storeHeight();
  };

export const proposedEventCallbacks = (args: OnLogsCallbackWrapperArgs) => ({
  onError: onError("Governance Proposed error"),
  onLogs: proposedOnLogs(args),
});

// ── VoteCast ─────────────────────────────────────────────────────────────────

type VoteCastGetEventsResult = Awaited<
  ReturnType<import("../utils.js").GovernanceContract["getEvents"]["VoteCast"]>
>;

const voteCastOnLogs =
  (wrapperArgs: OnLogsCallbackWrapperArgs) =>
  async (logs: VoteCastGetEventsResult) => {
    await asyncForEach(logs, async (log) => {
      await emit.governanceVoteCast(
        chicmozL1GovernanceVoteCastSchema.parse({
          proposalId: log.args.proposalId,
          voter: log.args.voter,
          support: log.args.support,
          amount: log.args.amount,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          l1TransactionHash: log.transactionHash,
          l1LogIndex: log.logIndex,
          isFinalized: wrapperArgs.isFinalized,
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    });
    await wrapperArgs.storeHeight();
  };

export const voteCastEventCallbacks = (args: OnLogsCallbackWrapperArgs) => ({
  onError: onError("Governance VoteCast error"),
  onLogs: voteCastOnLogs(args),
});

// ── ProposalExecuted ─────────────────────────────────────────────────────────

type ProposalExecutedGetEventsResult = Awaited<
  ReturnType<
    import("../utils.js").GovernanceContract["getEvents"]["ProposalExecuted"]
  >
>;

const proposalExecutedOnLogs =
  (wrapperArgs: OnLogsCallbackWrapperArgs) =>
  async (logs: ProposalExecutedGetEventsResult) => {
    await asyncForEach(logs, async (log) => {
      await emit.governanceProposalExecuted(
        chicmozL1GovernanceProposalExecutedSchema.parse({
          proposalId: log.args.proposalId,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          l1TransactionHash: log.transactionHash,
          l1LogIndex: log.logIndex,
          isFinalized: wrapperArgs.isFinalized,
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    });
    await wrapperArgs.storeHeight();
  };

export const proposalExecutedEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("Governance ProposalExecuted error"),
  onLogs: proposalExecutedOnLogs(args),
});

// ── ProposalDropped ──────────────────────────────────────────────────────────

type ProposalDroppedGetEventsResult = Awaited<
  ReturnType<
    import("../utils.js").GovernanceContract["getEvents"]["ProposalDropped"]
  >
>;

const proposalDroppedOnLogs =
  (wrapperArgs: OnLogsCallbackWrapperArgs) =>
  async (logs: ProposalDroppedGetEventsResult) => {
    await asyncForEach(logs, async (log) => {
      await emit.governanceProposalDropped(
        chicmozL1GovernanceProposalDroppedSchema.parse({
          proposalId: log.args.proposalId,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          l1TransactionHash: log.transactionHash,
          l1LogIndex: log.logIndex,
          isFinalized: wrapperArgs.isFinalized,
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    });
    await wrapperArgs.storeHeight();
  };

export const proposalDroppedEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("Governance ProposalDropped error"),
  onLogs: proposalDroppedOnLogs(args),
});

// ── GovernanceProposer (signaling) callbacks ────────────────────────────────

type SignalCastGetEventsResult = Awaited<
  ReturnType<
    import("../utils.js").GovernanceProposerContract["getEvents"]["SignalCast"]
  >
>;

const signalCastOnLogs =
  (wrapperArgs: OnLogsCallbackWrapperArgs) =>
  async (logs: SignalCastGetEventsResult) => {
    await asyncForEach(logs, async (log) => {
      await emit.governanceSignalCast(
        chicmozL1GovernanceSignalCastSchema.parse({
          payloadAddress: log.args.payload,
          round: log.args.round,
          signaler: log.args.signaler,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          l1TransactionHash: log.transactionHash,
          l1LogIndex: log.logIndex,
          isFinalized: wrapperArgs.isFinalized,
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    });
    await wrapperArgs.storeHeight();
  };

export const signalCastEventCallbacks = (args: OnLogsCallbackWrapperArgs) => ({
  onError: onError("GovernanceProposer SignalCast error"),
  onLogs: signalCastOnLogs(args),
});

// ── PayloadSubmittable ───────────────────────────────────────────────────────

type PayloadSubmittableGetEventsResult = Awaited<
  ReturnType<
    import("../utils.js").GovernanceProposerContract["getEvents"]["PayloadSubmittable"]
  >
>;

const payloadSubmittableOnLogs =
  (wrapperArgs: OnLogsCallbackWrapperArgs) =>
  async (logs: PayloadSubmittableGetEventsResult) => {
    await asyncForEach(logs, async (log) => {
      await emit.governancePayloadSubmittable(
        chicmozL1GovernancePayloadSubmittableSchema.parse({
          payloadAddress: log.args.payload,
          round: log.args.round,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          l1TransactionHash: log.transactionHash,
          l1LogIndex: log.logIndex,
          isFinalized: wrapperArgs.isFinalized,
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    });
    await wrapperArgs.storeHeight();
  };

export const payloadSubmittableEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("GovernanceProposer PayloadSubmittable error"),
  onLogs: payloadSubmittableOnLogs(args),
});

// ── PayloadSubmitted ─────────────────────────────────────────────────────────

type PayloadSubmittedGetEventsResult = Awaited<
  ReturnType<
    import("../utils.js").GovernanceProposerContract["getEvents"]["PayloadSubmitted"]
  >
>;

const payloadSubmittedOnLogs =
  (wrapperArgs: OnLogsCallbackWrapperArgs) =>
  async (logs: PayloadSubmittedGetEventsResult) => {
    await asyncForEach(logs, async (log) => {
      await emit.governancePayloadSubmitted(
        chicmozL1GovernancePayloadSubmittedSchema.parse({
          payloadAddress: log.args.payload,
          round: log.args.round,
          l1BlockNumber: log.blockNumber,
          l1BlockHash: log.blockHash,
          l1BlockTimestamp: await getBlockTimestamp(log.blockNumber),
          l1TransactionHash: log.transactionHash,
          l1LogIndex: log.logIndex,
          isFinalized: wrapperArgs.isFinalized,
        }),
      );
      wrapperArgs.updateHeight(log.blockNumber);
    });
    await wrapperArgs.storeHeight();
  };

export const payloadSubmittedEventCallbacks = (
  args: OnLogsCallbackWrapperArgs,
) => ({
  onError: onError("GovernanceProposer PayloadSubmitted error"),
  onLogs: payloadSubmittedOnLogs(args),
});

// ── Governance configuration / proposer history (generic) ────────────────────
// These are handled by the generic event allowlist + genericOnLogs in callbacks/index.ts
// No structured callbacks needed — they flow through L1_GENERIC_CONTRACT_EVENT.
