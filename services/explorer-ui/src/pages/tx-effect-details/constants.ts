import { z } from "zod";

// Define the tab IDs array
const tabIds = [
  "ecryptedLogs",
  "unencryptedLogs",
  "noteEncryptedLogs",
  "nullifiers",
  "noteHashes",
  "l2ToL1Msgs",
  "publicDataWrites",
] as const;

export const tabIdSchema = z.enum(tabIds);
export type TabId = z.infer<typeof tabIdSchema>;

export const tabSchema = z.object({
  id: tabIdSchema,
  label: z.string(),
});
export type Tab = z.infer<typeof tabSchema>;

export const txEffectTabs: Tab[] = [
  { id: "ecryptedLogs", label: "Encrypted logs" },
  { id: "unencryptedLogs", label: "Unencrypted logs" },
  { id: "noteEncryptedLogs", label: "Note encryped logs" },
  { id: "nullifiers", label: "Nullifiers" },
  { id: "noteHashes", label: "Note hashes" },
  { id: "l2ToL1Msgs", label: "L2 to L1 messages" },
  { id: "publicDataWrites", label: "Public data writes" },
];
