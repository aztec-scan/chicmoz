import { type AztecContracts } from "./utils.js";

export const STRUCTURED_ROLLUP_EVENT_NAMES = new Set([
  "CheckpointProposed",
  "L2ProofVerified",
]);

export const STRUCTURED_GOVERNANCE_EVENT_NAMES = new Set([
  "Proposed",
  "VoteCast",
  "ProposalExecuted",
  "ProposalDropped",
]);

export const STRUCTURED_GOVERNANCE_PROPOSER_EVENT_NAMES = new Set([
  "SignalCast",
  "PayloadSubmittable",
  "PayloadSubmitted",
]);

export const GENERIC_EVENT_ALLOWLIST = {
  rollup: [
    "CheckpointInvalidated",
    "PrunedPending",
    "Deposit",
    "WithdrawInitiated",
    "WithdrawFinalized",
    "Slashed",
    "ValidatorQueued",
  ],
  registry: ["CanonicalRollupUpdated"],
  inbox: [],
  outbox: [],
  feeJuicePortal: [],
  governance: [
    "GovernanceProposerUpdated",
    "ConfigurationUpdated",
  ],
  governanceProposer: [],
} satisfies Record<keyof AztecContracts, string[]>;
