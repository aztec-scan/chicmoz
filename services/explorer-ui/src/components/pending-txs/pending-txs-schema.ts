import { z } from "zod";

// Simplified schema for pending transactions
export const pendingTxSchema = z.object({
  txHash: z.string(),
  birthTimestamp: z.date(),
});

export type PendingTxSchema = z.infer<typeof pendingTxSchema>;
