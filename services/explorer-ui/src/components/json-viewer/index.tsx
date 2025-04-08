import type { FC } from "react";
import { useMemo, useState } from "react";
import { CollapsibleSection } from "./collapsible-section";
import { FilterBar } from "./filter-bar";
import { JsonDisplay } from "./json-display";
import { useJsonParser } from "./hooks/useJsonParser";

interface JsonViewerProps {
  data: unknown;
}

export const JsonViewer: FC<JsonViewerProps> = ({ data }) => {
  const [filter, setFilter] = useState("");
  const sections = useJsonParser(data);

  // Filter sections based on search term
  const filteredSections = useMemo(() => {
    if (!filter) {
      return sections;
    }

    return sections.filter((section) => {
      // Deep search the JSON for the filter text
      return JSON.stringify(section.data)
        .toLowerCase()
        .includes(filter.toLowerCase());
    });
  }, [sections, filter]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  return (
    <div>
      <div className="mb-4">
        <FilterBar onFilterChange={handleFilterChange} />
      </div>

      {filteredSections.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 italic">
          No matching data found
        </div>
      ) : (
        filteredSections.map((section, index) => (
          <CollapsibleSection
            key={`${section.title}-${index}`}
            title={section.title}
            defaultExpanded={section.isExpandedByDefault}
          >
            <JsonDisplay data={section.data} />
          </CollapsibleSection>
        ))
      )}
    </div>
  );
};
