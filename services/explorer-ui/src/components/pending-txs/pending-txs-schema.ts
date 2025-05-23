import { z } from "zod";

// Simplified schema for pending transactions
export const pendingTxSchema = z.object({
  hash: z.string(),
  birthTimestamp: z.number(),
});

export type PendingTxSchema = z.infer<typeof pendingTxSchema>;
