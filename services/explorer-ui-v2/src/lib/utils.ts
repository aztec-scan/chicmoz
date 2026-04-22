import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Short middle-ellipsis — e.g. `0xabcd…1234` — for hashes and addresses. */
export const truncateHashString = (
  value: string | null | undefined,
  startLen = 10,
  endLen = 8,
): string => {
  if (!value) {return "";}
  if (value.length <= startLen + endLen + 1) {return value;}
  return `${value.slice(0, startLen)}…${value.slice(-endLen)}`;
};

export const fmtNum = (n: number | bigint | string | undefined | null): string => {
  if (n === undefined || n === null) {return "—";}
  if (typeof n === "bigint") {return n.toLocaleString("en-US");}
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num)) {return "—";}
  return num.toLocaleString("en-US");
};

const INTERVALS = [
  { label: "d", seconds: 86400 },
  { label: "h", seconds: 3600 },
  { label: "m", seconds: 60 },
  { label: "s", seconds: 1 },
];

/** Human age string matching the design ("12m 4s ago", "just now"). */
export const ageStr = (ts: number | Date | null | undefined): string => {
  if (ts === null || ts === undefined) {return "—";}
  const millis = ts instanceof Date ? ts.getTime() : ts;
  if (!Number.isFinite(millis)) {return "—";}
  const s = Math.max(0, Math.floor((Date.now() - millis) / 1000));
  if (s < 1) {return "just now";}
  if (s < 60) {return `${s}s ago`;}
  const m = Math.floor(s / 60);
  if (m < 60) {return `${m}m ${s % 60}s ago`;}
  const h = Math.floor(m / 60);
  if (h < 24) {return `${h}h ${m % 60}m ago`;}
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ago`;
};

export const formatDuration = (durationMs: number): string => {
  const s = Math.floor(durationMs / 1000);
  for (const interval of INTERVALS) {
    const count = Math.floor(s / interval.seconds);
    if (count >= 1) {return `${count}${interval.label}`;}
  }
  return "just now";
};

export const toIsoUtc = (ts: number | Date | null | undefined): string => {
  if (ts === null || ts === undefined) {return "—";}
  const millis = ts instanceof Date ? ts.getTime() : ts;
  if (!Number.isFinite(millis)) {return "—";}
  return `${new Date(millis).toISOString().replace("T", " ").slice(0, 19)} UTC`;
};

/** Fee-juice formatting to a fixed precision with graceful fallback. */
export const formatFees = (
  value: bigint | string | number | null | undefined,
  decimals = 18,
  precision = 4,
): string => {
  if (value === null || value === undefined) {return "—";}
  try {
    const big = typeof value === "bigint" ? value : BigInt(value);
    if (big === 0n) {return "0";}
    const scale = 10n ** BigInt(decimals);
    const whole = big / scale;
    const fraction = big % scale;
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, precision);
    return `${whole.toString()}.${fractionStr}`;
  } catch {
    return "—";
  }
};

export const toHex = (value: unknown): string => {
  if (value === null || value === undefined) {return "";}
  if (typeof value === "string") {return value;}
  if (typeof value === "bigint") {return `0x${value.toString(16)}`;}
  return String(value);
};
