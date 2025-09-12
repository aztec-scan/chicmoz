import { z } from "zod";
import { ethAddressSchema } from "../general.js";

export const slotStatusEnumSchema = z.enum(["attestation-missed","attestation-sent", "block-proposed", "block-mined", "block-missed"])

const historyEntrySchema = z.object({
  slot: z.coerce.bigint().nonnegative(),
  status: slotStatusEnumSchema,
});

const missedSlotSchema = z.object({
  count: z.number().default(0),
  currentStreak: z.number().default(0),
  rate: z.number().default(0),
});

const lastAttestationSchema = z.object({
  slot: z.coerce.bigint().nonnegative(),
  timestamp: z.string(),
});

export const sentinelSlotStats = z.object({
  address: ethAddressSchema,
  history: z.array(historyEntrySchema),
  missedAttestations: missedSlotSchema,
  missedProposals: missedSlotSchema,
  lastAttestation: z.optional(lastAttestationSchema),
  totalSlots: z.number(),
});

export const sentinelSlotObject = z.object({
  initialSlot: z.coerce.bigint().nonnegative(),
  lastProcessedSlot: z.coerce.bigint().nonnegative(),
  slotWindow: z.coerce.number(),
  stats: z.record(ethAddressSchema, sentinelSlotStats),
});


export type SenintelSlotWindowStats = z.infer<typeof sentinelSlotStats>;
export type SenintelSlotWindow = z.infer<typeof sentinelSlotObject>;
export type SlotStatusEnum = z.infer<typeof slotStatusEnumSchema>;
