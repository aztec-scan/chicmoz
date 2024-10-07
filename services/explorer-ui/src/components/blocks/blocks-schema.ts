import { z } from "zod";

export type BlockTableSchema = z.infer<typeof blockSchema>;

export const blockSchema = z.object({
  height: z.number(),
  blockHash: z.string(),
  numberOfTransactions: z.number(),
  txEffectsLength: z.number(),
  totalFees: z.number(),
  timestamp: z.number(),
});
