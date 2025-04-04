import type { FC } from "react";
import { JsonViewer } from "~/components/json-viewer";

interface ArtifactExplorerTabProps {
  data: unknown;
}

export const ArtifactExplorerTab: FC<ArtifactExplorerTabProps> = ({ data }) => {
  return <JsonViewer data={data} />;
};
