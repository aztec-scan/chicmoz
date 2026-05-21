#!/usr/bin/env node

const defaultUrls = [
  "https://api.aztecscan.xyz/l2/tips",
  "https://api.testnet.aztecscan.xyz/l2/tips",
  "https://api.devnet.aztecscan.xyz/l2/tips",
];

const urls = (process.env.L2_TIPS_HEALTH_URLS ?? defaultUrls.join(","))
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const staleGraceMs = Number(process.env.L2_TIPS_STALE_GRACE_MS ?? 120_000);
const requiredTipKeys = ["proposed", "checkpointed", "proven", "finalized"];

const isTipBlock = (value) =>
  value &&
  typeof value === "object" &&
  Number.isSafeInteger(value.number) &&
  typeof value.hash === "string" &&
  value.hash.startsWith("0x");

const isCheckpointTip = (value) =>
  value &&
  typeof value === "object" &&
  isTipBlock(value.block) &&
  value.checkpoint &&
  Number.isSafeInteger(value.checkpoint.number) &&
  typeof value.checkpoint.hash === "string" &&
  value.checkpoint.hash.startsWith("0x");

const validateShape = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("payload is not an object");
  }
  if (!payload.tips || typeof payload.tips !== "object") {
    throw new Error("payload.tips is missing");
  }
  for (const key of requiredTipKeys) {
    const valid = key === "proposed" ? isTipBlock(payload.tips[key]) : isCheckpointTip(payload.tips[key]);
    if (!valid) {
      throw new Error(`payload.tips.${key} has unexpected shape`);
    }
  }
  for (const key of ["observedAt", "stalenessMs", "staleAfterMs"]) {
    if (!Number.isSafeInteger(payload[key]) || payload[key] < 0) {
      throw new Error(`payload.${key} must be a non-negative integer`);
    }
  }
  for (const key of ["stale", "degraded"]) {
    if (typeof payload[key] !== "boolean") {
      throw new Error(`payload.${key} must be boolean`);
    }
  }
};

const checkUrl = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  const payload = await response.json();
  validateShape(payload);
  if (payload.stale || payload.stalenessMs > payload.staleAfterMs + staleGraceMs) {
    throw new Error(
      `${url} reports stale tips: stalenessMs=${payload.stalenessMs} staleAfterMs=${payload.staleAfterMs}`,
    );
  }
  if (payload.degraded) {
    throw new Error(`${url} reports degraded tips: ${payload.degradedReason ?? "unknown reason"}`);
  }
  if (payload.repeatedDegradedBoundaryMismatch) {
    throw new Error(
      `${url} reports repeated boundary mismatch: ${JSON.stringify(payload.repeatedDegradedBoundaryMismatch)}`,
    );
  }
};

const failures = [];
for (const url of urls) {
  try {
    await checkUrl(url);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

if (failures.length > 0) {
  throw new Error(`L2 tips health canary failed:\n- ${failures.join("\n- ")}`);
}
