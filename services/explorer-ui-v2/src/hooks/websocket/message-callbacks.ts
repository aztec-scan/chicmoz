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
  let parsed: { block?: unknown; topic?: string; txs?: unknown };
  try {
    parsed = JSON.parse(raw) as {
      block?: unknown;
      topic?: string;
      txs?: unknown;
    };
  } catch {
    return;
  }

  const topic = parsed.topic?.toLowerCase();
  const hasBlockUpdate = parsed.block !== undefined || topic?.includes("block");
  const hasTxUpdate = parsed.txs !== undefined || topic?.includes("tx");
  const hasStatsUpdate = topic?.includes("stats");

  if (hasBlockUpdate) {
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestBlock,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestTableBlocks,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.blocksByStatus,
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
