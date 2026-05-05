import { type ChicmozL1GenericContractEvent } from "@chicmoz-pkg/types";
import { truncateHashString } from "~/lib/utils";

/**
 * Colour + semantic bucket for an event name. Events that don't match a known
 * pattern fall into the neutral bucket with a grey bullet.
 */
export const eventKind = (eventName: string): string => {
  const n = eventName.toLowerCase();
  if (n.includes("block") || n.includes("proof") || n.includes("epoch"))
    {return "block";}
  if (n.includes("message") || n.includes("inbox") || n.includes("outbox") || n.includes("root"))
    {return "message";}
  if (n.includes("deposit")) {return "deposit";}
  if (n.includes("withdraw")) {return "withdraw";}
  if (n.includes("slash")) {return "slash";}
  if (n.includes("validator") || n.includes("attester")) {return "validator";}
  if (n.includes("rollup") || n.includes("registry")) {return "registry";}
  return "other";
};

export const formatArgValue = (v: unknown): string => {
  if (v === null || v === undefined) {return "null";}
  if (typeof v === "bigint") {return v.toString();}
  if (typeof v === "string") {
    if (v.startsWith("0x") && v.length > 20)
      {return truncateHashString(v, 8, 6);}
    return v;
  }
  if (typeof v === "boolean" || typeof v === "number") {return String(v);}
  return "…";
};

/** Human-ish preview of eventArgs — first 2 keys, values truncated. */
export const argsPreview = (
  args: ChicmozL1GenericContractEvent["eventArgs"],
): string => {
  if (!args) {return "—";}
  const entries = Object.entries(args).slice(0, 2);
  if (entries.length === 0) {return "—";}
  return entries
    .map(([k, v]) => `${k}=${formatArgValue(v)}`)
    .join(" · ");
};

export const findL2BlockNumber = (
  args: ChicmozL1GenericContractEvent["eventArgs"],
): number | null => {
  if (!args) {return null;}
  const candidates = ["l2BlockNumber", "l2Block", "blockNumber"];
  for (const k of candidates) {
    const v = args[k];
    if (typeof v === "bigint") {return Number(v);}
    if (typeof v === "number" && Number.isFinite(v)) {return v;}
    if (typeof v === "string" && /^\d+$/.test(v)) {return Number(v);}
  }
  return null;
};

export const eventTimestampMs = (
  evt: ChicmozL1GenericContractEvent,
): number | null => {
  const ts = evt.l1BlockTimestamp;
  return typeof ts === "number" && Number.isFinite(ts) ? ts : null;
};
