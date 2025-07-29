import { type L1L2ValidatorStatus } from "@chicmoz-pkg/types";

export interface ValidatorTableSchema {
  attester: string;
  withdrawer: string;
  proposer: string;
  stake: bigint;
  status: L1L2ValidatorStatus;
  firstSeenAt: number;
  latestSeenChangeAt: number;
}
