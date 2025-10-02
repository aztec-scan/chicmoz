import { z } from "zod";
import { ethAddressSchema } from "../general.js";
import { ValidatorStatusInSlot } from "@aztec/stdlib/validators"

const _statusMap: { [K in ValidatorStatusInSlot]: K } = {
  "block-mined": "block-mined",
  "block-proposed": "block-proposed",
  "block-missed": "block-missed",
  "attestation-sent": "attestation-sent",
  "attestation-missed": "attestation-missed",
};

const validatorStatusValues = Object.values(_statusMap) as unknown as readonly ValidatorStatusInSlot[];

export const slotStatusEnumSchema = z.enum(validatorStatusValues as [ValidatorStatusInSlot, ...ValidatorStatusInSlot[]])

const historyEntrySchema = z.object({
  slot: z.coerce.bigint().nonnegative(),
  status: slotStatusEnumSchema,
});

const activityCounterSchema = z.object({
  total: z.number().default(0),
  missed: z.number().default(0),
  lastSeenAtSlot: z.coerce.bigint().nonnegative().nullish(),
  lastSeenAt: z.coerce.number().nullish(),
});

export const sentinelValidatorStatsSchema = z.object({
  attester: ethAddressSchema,
  history: z.array(historyEntrySchema),
  attestations: activityCounterSchema,
  blocks: activityCounterSchema,
  totalSlots: z.number(),
  lastSeenAtSlot: z.coerce.bigint().nonnegative().nullish(),
  lastSeenAt: z.coerce.number().nullish(),
});

export const sentinelSlotObject = z.object({
  initialSlot: z.coerce.bigint().nonnegative(),
  lastProcessedSlot: z.coerce.bigint().nonnegative(),
  slotWindow: z.coerce.number(),
  stats: z.record(ethAddressSchema, sentinelValidatorStatsSchema),
});

export const sentinelFilterSchema = z.enum(["desc-latest","asc-latest", "desc-slots", "asc-slots"])


export type SentinelValidatorStats = z.infer<typeof sentinelValidatorStatsSchema>;
export type SentinelHistory = z.infer<typeof historyEntrySchema>;
export type SentinelActivity = z.infer<typeof activityCounterSchema>;
export type SentinelSlotResponse = z.infer<typeof sentinelSlotObject>;
export type SlotStatusEnum = z.infer<typeof slotStatusEnumSchema>;
export type SentinelFilterEnum = z.infer<typeof sentinelFilterSchema>;
