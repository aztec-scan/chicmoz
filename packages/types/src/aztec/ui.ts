import { z } from "zod";
import {
  chicmozL2BlockFinalizationStatusSchema,
  hexStringSchema,
} from "../index.js";
import { frTimestampSchema } from "./utils.js";

export const uiBlockTableSchema = z.object({
  blockHash: hexStringSchema,
  height: z.coerce.bigint().nonnegative(),
  timestamp: frTimestampSchema,
  txEffectsLength: z.number(),
  blockStatus: chicmozL2BlockFinalizationStatusSchema,
});

export type UiBlockTable = z.infer<typeof uiBlockTableSchema>;
