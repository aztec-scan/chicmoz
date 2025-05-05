import { z } from "zod";

export type tabId =
  | "contractVersions"
  | "contractInstances"
  | "privateFunctions"
  | "utilityFunctions"
  | "publicFunctions"
  | "artifactJson"
  | "artifactExplorer";

export const tabIds = [
  "contractVersions",
  "contractInstances",
  "privateFunctions",
  "utilityFunctions",
  "artifactJson",
  "publicFunctions",
  "artifactExplorer"
] as const;

export const tabIdSchema = z.enum(tabIds);
export type TabId = z.infer<typeof tabIdSchema>;

export const tabSchema = z.object({
  id: tabIdSchema,
  label: z.string(),
});
export type Tab = z.infer<typeof tabSchema>;

export const contractClassTabs: Tab[] = [
  { id: "contractVersions", label: "Versions" },
  { id: "contractInstances", label: "Instances" },
  { id: "privateFunctions", label: "Private functions" },
  { id: "utilityFunctions", label: "Utility functions" },
  { id: "publicFunctions", label: "Public functions" },
  { id: "artifactJson", label: "Artifact JSON" },
  { id: "artifactExplorer", label: "Artifact Explorer" }
];
