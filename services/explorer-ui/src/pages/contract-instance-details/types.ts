import { z } from "zod";
import { type DetailItem } from "~/components/info-display/key-value-display";

export type tabId = "verifiedDeployment" | "contactDetails" | "aztecScanNotes";

export const tabIds = [
  "verifiedDeployment",
  "contactDetails",
  "aztecScanNotes",
  "contractClassArtifect",
  "contractClassArtifectExplorer",
  "contractClassType",
] as const;

export const tabIdSchema = z.enum(tabIds);
export type TabId = z.infer<typeof tabIdSchema>;

export const tabSchema = z.object({
  id: tabIdSchema,
  label: z.string(),
});
export type Tab = z.infer<typeof tabSchema>;

export const verifiedDeploymentTabs: Tab[] = [
  { id: "verifiedDeployment", label: "Verified deployment" },
  { id: "contactDetails", label: "Contact details" },
  { id: "aztecScanNotes", label: "Aztec Scan notes" },
  { id: "contractClassArtifect", label: "Contract Artifect" },
  { id: "contractClassArtifectExplorer", label: "Artifect Explorer" },
  { id: "contractClassType", label: "Contract type" },
];

export interface VerifiedDeploymentData {
  deployer: { data: DetailItem[] };
  salt: { data: DetailItem[] };
  publicKeys: { data: DetailItem[] };
  args: { data: DetailItem[] };
}
export interface ContactDetailsData {
  appWebsiteUrl: { data: DetailItem[] };
  externalUrls: { data: DetailItem[] };
  creatorName: { data: DetailItem[] };
  contact: { data: DetailItem[] };
}

export interface AztecScanNotesData {
  origin: { data: DetailItem[] };
  comment: { data: DetailItem[] };
  relatedL1ContractAddresses: { data: DetailItem[] };
}
