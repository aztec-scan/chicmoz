import { z } from "zod";
import { hexStringSchema } from "../general.js";

export const chicmozReorgSchema = z.object({
  orphanedBlockHash: hexStringSchema,
  height: z.coerce.bigint().nonnegative(),
  timestamp: z.coerce.date(),
  nbrOfOrphanedBlocks: z.number().int().nonnegative(),
});

export type ChicmozReorg = z.infer<typeof chicmozReorgSchema>;
