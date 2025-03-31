import { type FC, useState, useMemo } from "react";
import { CollapsibleSection } from "./collapsible-section";
import { FilterBar } from "./filter-bar";
import { JsonDisplay } from "./json-display";

interface JsonViewerProps {
  data: unknown;
}

type ArtifactSection = {
  title: string;
  data: unknown;
  priority: number; // Lower number = higher priority
  isExpandedByDefault: boolean;
};

export const JsonViewer: FC<JsonViewerProps> = ({ data }) => {
  const [filter, setFilter] = useState("");
  const [showAllSections, setShowAllSections] = useState(false);
  
  // Parse the artifact JSON into meaningful sections
  const sections = useMemo(() => {
    if (!data) return [];

    try {
      const artifactData = typeof data === 'string' ? JSON.parse(data) : data;
      const sections: ArtifactSection[] = [];

      // Add general information (name, version, etc.)
      const generalInfo: Record<string, unknown> = {
        name: artifactData.name,
        version: artifactData.version,
      };
      
      if (Object.keys(generalInfo).some(key => generalInfo[key] !== undefined)) {
        sections.push({
          title: "General Information",
          data: generalInfo,
          priority: 1,
          isExpandedByDefault: true,
        });
      }

      // Add functions
      if (artifactData.functions && artifactData.functions.length > 0) {
        sections.push({
          title: "Functions",
          data: artifactData.functions,
          priority: 2,
          isExpandedByDefault: true,
        });
      }

      // Add types
      if (artifactData.types && Object.keys(artifactData.types).length > 0) {
        sections.push({
          title: "Types",
          data: artifactData.types,
          priority: 3,
          isExpandedByDefault: false,
        });
      }

      // Add constants
      if (artifactData.constants && Object.keys(artifactData.constants).length > 0) {
        sections.push({
          title: "Constants",
          data: artifactData.constants,
          priority: 4,
          isExpandedByDefault: false,
        });
      }

      // Add events
      if (artifactData.events && artifactData.events.length > 0) {
        sections.push({
          title: "Events",
          data: artifactData.events,
          priority: 5,
          isExpandedByDefault: false,
        });
      }

      // Add Other Information section for all remaining fields
      const otherFields = { ...artifactData };
      ['name', 'version', 'functions', 'types', 'constants', 'events'].forEach(field => {
        delete otherFields[field];
      });

      if (Object.keys(otherFields).length > 0) {
        sections.push({
          title: "Other Information",
          data: otherFields,
          priority: 100, // Low priority = show at the end
          isExpandedByDefault: false,
        });
      }

      // If no sections were created, add a fallback for the full data
      if (sections.length === 0) {
        sections.push({
          title: "Full Data",
          data: artifactData,
          priority: 1,
          isExpandedByDefault: true,
        });
      }

      // Sort sections by priority
      return sections.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error("Error parsing artifact JSON:", error);
      
      // Fallback: show raw data
      return [{
        title: "Raw Data",
        data: data,
        priority: 1,
        isExpandedByDefault: true,
      }];
    }
  }, [data]);

  // Filter sections based on search term
  const filteredSections = useMemo(() => {
    if (!filter) return sections;
    
    return sections.filter(section => {
      // Deep search the JSON for the filter text
      return JSON.stringify(section.data).toLowerCase().includes(filter.toLowerCase());
    });
  }, [sections, filter]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const toggleShowAllSections = () => {
    setShowAllSections(!showAllSections);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <FilterBar onFilterChange={handleFilterChange} />
        <button 
          onClick={toggleShowAllSections}
          className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {showAllSections ? "Show Less" : "Show All"}
        </button>
      </div>
      
      {filteredSections.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 italic">No matching data found</div>
      ) : (
        filteredSections.map((section, index) => (
          <CollapsibleSection 
            key={`${section.title}-${index}`} 
            title={section.title}
            defaultExpanded={section.isExpandedByDefault || showAllSections}
          >
            <JsonDisplay data={section.data} />
          </CollapsibleSection>
        ))
      )}
    </div>
  );
};
