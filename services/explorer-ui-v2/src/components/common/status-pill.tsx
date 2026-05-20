import { type FC } from "react";

export type BlockStatusKey =
  | "proposed"
  | "proven"
  | "finalized"
  | "orphaned"
  | "pending";

export type TxStatusKey = "mined" | "pending" | "dropped";

export type ValidatorStatusKey =
  | "validating"
  | "registered"
  | "living"
  | "exiting"
  | "zombie";

export type VerificationStatusKey = "verified" | "unverified";

interface Props {
  status: string;
  label?: string;
}

/** Uniform status pill used across tables and detail headers. */
export const StatusPill: FC<Props> = ({ status, label }) => (
  <span className={`status-pill ${status}`}>
    <span className="s-dot" />
    {label ?? status}
  </span>
);
