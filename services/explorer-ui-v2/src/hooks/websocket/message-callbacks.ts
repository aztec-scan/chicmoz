import type { QueryClient } from "@tanstack/react-query";
import { queryKeyGenerator } from "~/hooks/api";

/**
 * The websocket publisher sends compact payloads such as `{ block }` and
 * `{ txs }`. Older/alternate publishers may send a `{ topic }` envelope, so we
 * keep a case-insensitive topic fallback as well.
 */
export const handleWebSocketMessage = async (
  queryClient: QueryClient,
  raw: string,
): Promise<void> => {
  let parsed: {
    block?: unknown;
    l2Tips?: unknown;
    topic?: string;
    txs?: unknown;
  };
  try {
    parsed = JSON.parse(raw) as {
      block?: unknown;
      l2Tips?: unknown;
      topic?: string;
      txs?: unknown;
    };
  } catch {
    return;
  }

  const topic = parsed.topic?.toLowerCase();
  const hasBlockUpdate =
    parsed.block !== undefined || (topic?.includes("block") ?? false);
  const hasTipsUpdate =
    parsed.l2Tips !== undefined || (topic?.includes("tips") ?? false);
  const hasTxUpdate =
    parsed.txs !== undefined || (topic?.includes("tx") ?? false);
  const hasStatsUpdate = topic?.includes("stats") ?? false;

  if (hasBlockUpdate || hasTipsUpdate) {
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestBlock,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestTableBlocks,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.blocksByNativeStatus,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.l2TipsHealth,
    });
  }

  if (hasTxUpdate) {
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestTableTxEffects,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.pendingTxs,
    });
  }

  if (hasStatsUpdate) {
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  }
};
