import { type HexString } from "@chicmoz-pkg/types";
import {
  deriveNativeStatus,
  getTips,
} from "../../../../database/controllers/l2/tips.js";

type NativeStatusBlockLike = {
  blockHash?: unknown;
  hash?: unknown;
  height?: unknown;
  nativeStatus?: unknown;
  orphan?: unknown;
};

const getHash = (block: NativeStatusBlockLike): HexString | null => {
  const hash = block.hash ?? block.blockHash;
  return typeof hash === "string" && hash.startsWith("0x")
    ? (hash as HexString)
    : null;
};

const getHeight = (block: NativeStatusBlockLike): bigint | null => {
  if (block.height === undefined || block.height === null) {
    return null;
  }
  try {
    return BigInt(String(block.height));
  } catch {
    return null;
  }
};

const hasOrphan = (orphan: unknown) => {
  if (typeof orphan === "boolean") {
    return orphan;
  }
  return orphan !== undefined && orphan !== null;
};

const overlayBlockNativeStatus = (
  block: NativeStatusBlockLike,
  tips: Awaited<ReturnType<typeof getTips>>,
) => {
  const hash = getHash(block);
  const height = getHeight(block);
  if (!hash || height === null) {
    return block;
  }

  block.nativeStatus = deriveNativeStatus(
    {
      hash,
      height,
      orphan: hasOrphan(block.orphan)
        ? { timestamp: 0, hasOrphanedParent: false }
        : undefined,
    },
    tips,
  );
  return block;
};

/**
 * Block payloads are mostly immutable and worth caching, but `nativeStatus` is
 * a dynamic overlay derived from latest L2 tips. Recompute it after reading
 * cached JSON so stale degraded-tip windows do not pin `unknown` until TTL
 * expiry.
 */
export const overlayNativeStatuses = async <T>(payload: T): Promise<T> => {
  const tips = await getTips();
  if (Array.isArray(payload)) {
    for (const item of payload) {
      overlayBlockNativeStatus(item as NativeStatusBlockLike, tips);
    }
    return payload;
  }
  if (typeof payload === "object" && payload !== null) {
    overlayBlockNativeStatus(payload as NativeStatusBlockLike, tips);
  }
  return payload;
};

export const parseWithFreshNativeStatuses = async (cachedJson: string) => {
  const payload: unknown = JSON.parse(cachedJson);
  return overlayNativeStatuses(payload);
};
