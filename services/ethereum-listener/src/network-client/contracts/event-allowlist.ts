import { type AztecContracts } from "./utils.js";

export const STRUCTURED_ROLLUP_EVENT_NAMES = new Set([
  "CheckpointProposed",
  "L2ProofVerified",
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
} satisfies Record<keyof AztecContracts, string[]>;
