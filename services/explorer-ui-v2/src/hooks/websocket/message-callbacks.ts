import type { QueryClient } from "@tanstack/react-query";
import { queryKeyGenerator } from "~/hooks/api";

/**
 * Minimal WS handler: the backend pushes block/tx events in a string envelope,
 * and we just invalidate the tables/stats so react-query refetches. This keeps
 * the surface small — the exact message shape lives in aztec-listener.
 */
export const handleWebSocketMessage = async (
  queryClient: QueryClient,
  raw: string,
): Promise<void> => {
  let topic: string | undefined;
  try {
    const parsed = JSON.parse(raw) as { topic?: string };
    topic = parsed.topic;
  } catch {
    return;
  }

  if (!topic) {return;}

  if (topic.includes("block") || topic.includes("Block")) {
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestBlock,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestTableBlocks,
    });
  }
  if (topic.includes("tx") || topic.includes("Tx")) {
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestTableTxEffects,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.pendingTxs,
    });
  }
  if (topic.includes("stats") || topic.includes("Stats")) {
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  }
};
