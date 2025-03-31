import { type FC } from "react";
import { CollapsibleSection } from "./collapsible-section";
import { FilterBar } from "./filter-bar";
import { JsonDisplay } from "./json-display";

interface JsonViewerProps {
  data: unknown;
}

export const JsonViewer: FC<JsonViewerProps> = ({ data }) => {
  // Simple implementation for now - just display all data
  // In the enhanced version, we'll parse and filter the data
  const handleFilterChange = (newFilter: string) => {
    // Filter implementation will be added in the enhanced version
    console.log("Filter changed:", newFilter);
  };

  return (
    <div>
      <FilterBar onFilterChange={handleFilterChange} />
      <CollapsibleSection title="Artifact JSON" defaultExpanded={true}>
        <JsonDisplay data={data} />
      </CollapsibleSection>
    </div>
  );
};
