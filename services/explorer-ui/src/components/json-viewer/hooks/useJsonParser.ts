import { useMemo } from "react";

// Types
export interface ArtifactSection {
  title: string;
  data: unknown;
  priority: number; // Lower number = higher priority
  isExpandedByDefault: boolean;
}

export interface ArtifactData {
  name?: string;
  version?: string | number;
  functions?: unknown[];
  types?: Record<string, unknown>;
  constants?: Record<string, unknown>;
  events?: unknown[];
  [key: string]: unknown;
}

// Helper functions
function parseJsonData(data: unknown): unknown {
  if (!data) {
    return {};
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  
  return data;
}

function createFunctionsSection(artifactData: ArtifactData): ArtifactSection | null {
  if (
    artifactData.functions &&
    Array.isArray(artifactData.functions) &&
    artifactData.functions.length > 0
  ) {
    return {
      title: "Functions",
      data: artifactData.functions,
      priority: 1,
      isExpandedByDefault: true,
    };
  }
  return null;
}

function createGeneralInfoSection(artifactData: ArtifactData): ArtifactSection | null {
  const generalInfo: Record<string, unknown> = {};
  if (artifactData.name !== undefined) {
    generalInfo.name = artifactData.name;
  }
  if (artifactData.version !== undefined) {
    generalInfo.version = artifactData.version;
  }

  if (Object.keys(generalInfo).some((key) => generalInfo[key] !== undefined)) {
    return {
      title: "General Information",
      data: generalInfo,
      priority: 2,
      isExpandedByDefault: true,
    };
  }
  return null;
}

function createTypesSection(artifactData: ArtifactData): ArtifactSection | null {
  if (
    artifactData.types &&
    typeof artifactData.types === "object" &&
    Object.keys(artifactData.types).length > 0
  ) {
    return {
      title: "Types",
      data: artifactData.types,
      priority: 3,
      isExpandedByDefault: false,
    };
  }
  return null;
}

function createConstantsSection(artifactData: ArtifactData): ArtifactSection | null {
  if (
    artifactData.constants &&
    typeof artifactData.constants === "object" &&
    Object.keys(artifactData.constants).length > 0
  ) {
    return {
      title: "Constants",
      data: artifactData.constants,
      priority: 4,
      isExpandedByDefault: false,
    };
  }
  return null;
}

function createEventsSection(artifactData: ArtifactData): ArtifactSection | null {
  if (
    artifactData.events &&
    Array.isArray(artifactData.events) &&
    artifactData.events.length > 0
  ) {
    return {
      title: "Events",
      data: artifactData.events,
      priority: 5,
      isExpandedByDefault: false,
    };
  }
  return null;
}

function createOtherInfoSection(artifactData: ArtifactData): ArtifactSection | null {
  const otherFields: Record<string, unknown> = { ...artifactData };
  ["name", "version", "functions", "types", "constants", "events"].forEach(
    (field) => {
      delete otherFields[field];
    },
  );

  if (Object.keys(otherFields).length > 0) {
    return {
      title: "Other Information",
      data: otherFields,
      priority: 100, // Low priority = show at the end
      isExpandedByDefault: false,
    };
  }
  return null;
}

function createFallbackSection(artifactData: ArtifactData): ArtifactSection {
  return {
    title: "Full Data",
    data: artifactData,
    priority: 1,
    isExpandedByDefault: true,
  };
}

function parseAndOrganizeJson(data: unknown): ArtifactSection[] {
  if (!data) {
    return [];
  }

  try {
    const parsedData = parseJsonData(data);
    const artifactData = parsedData as ArtifactData;
    const sections: ArtifactSection[] = [];

    // Add all sections, filtering out null values
    [
      createFunctionsSection(artifactData),
      createGeneralInfoSection(artifactData),
      createTypesSection(artifactData),
      createConstantsSection(artifactData),
      createEventsSection(artifactData),
      createOtherInfoSection(artifactData),
    ]
      .filter((section): section is ArtifactSection => section !== null)
      .forEach((section) => sections.push(section));

    // If no sections were created, add a fallback for the full data
    if (sections.length === 0) {
      sections.push(createFallbackSection(artifactData));
    }

    // Sort sections by priority
    return sections.sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.error("Error parsing artifact JSON:", error);

    // Fallback: show raw data
    return [
      {
        title: "Raw Data",
        data: data,
        priority: 1,
        isExpandedByDefault: true,
      },
    ];
  }
}

export function useJsonParser(data: unknown): ArtifactSection[] {
  return useMemo(() => parseAndOrganizeJson(data), [data]);
}
