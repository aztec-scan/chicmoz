import { ExternalLink } from "lucide-react";
import type { FC } from "react";
import { CustomTooltip } from "~/components/custom-tooltip";
import { API_URL, aztecExplorer } from "~/service/constants";
import { JsonTab } from "./json-tab";

interface ArtifactJsonTabProps {
  data: unknown;
  artifactHash: string;
}

export const ArtifactJsonTab: FC<ArtifactJsonTabProps> = ({
  data,
  artifactHash,
}) => {
  const apiEndpoint = `${API_URL}${aztecExplorer.getL2Artifacts(artifactHash)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CustomTooltip content="Open API-endpoint in a new tab">
          <a
            href={apiEndpoint}
            target="_blank"
            rel="noreferrer"
            className="text-primary-600 text-primary cursor-pointer hover:opacity-80 flex items-center gap-1"
          >
            The same data is also available through our API.
            <ExternalLink size={14} className="text-purple-light" />
          </a>
        </CustomTooltip>
      </div>
      <JsonTab data={data} />
    </div>
  );
};
