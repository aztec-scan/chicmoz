import { chicmozL2BlockFinalizationStatusSchema } from "@chicmoz-pkg/types";
import { z } from "zod";

export type BlockTableSchema = z.infer<typeof blockSchema>;

export const blockSchema = z.object({
  height: z.coerce.number(),
  blockHash: z.string(),
  txEffectsLength: z.number(),
  totalManaUsed: z.coerce.string(),
  blockStatus: chicmozL2BlockFinalizationStatusSchema,
  timestamp: z.number(),
});
