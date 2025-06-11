import { useState, type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { OptionButtons } from "~/components/option-buttons";
import { verifiedDeploymentTabs, type TabId } from "./types";
import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { getVerifiedContractInstanceDeploymentData } from "./util";
import { useContractClass } from "~/hooks";
import { Loader } from "~/components/loader";
import { ArtifactJsonTab } from "../contract-class-details/tabs/artifact-json-tab";
import { ArtifactExplorerTab } from "../contract-class-details/tabs/artifact-explorer-tab";

interface PillSectionProps {
  contractInstanceDetails: ChicmozL2ContractInstanceDeluxe;
}
export const TabsSection: FC<PillSectionProps> = ({
  contractInstanceDetails,
}) => {
  const { verifiedDeploymentArguments, deployerMetadata, aztecScanNotes } =
    getVerifiedContractInstanceDeploymentData(contractInstanceDetails);

  const selectedVersionWithArtifactRes = useContractClass({
    classId: contractInstanceDetails.originalContractClassId,
    version: contractInstanceDetails.version.toString(),
    includeArtifactJson: true,
  });
  const [selectedTab, setSelectedTab] = useState<TabId>("verifiedDeployment");
  const onOptionSelect = (value: string) => {
    setSelectedTab(value as TabId);
  };

  const isAvailable = {
    verifiedDeployment: !!verifiedDeploymentArguments,
    contactDetails: !!deployerMetadata,
    aztecScanNotes: !!aztecScanNotes,
    contractClassArtifect: !!selectedVersionWithArtifactRes.data?.artifactJson,
    contractClassArtifectExplorer:
      !!selectedVersionWithArtifactRes.data?.artifactJson,
  };

  // Check if any options are available
  const hasAnyAvailableOptions = Object.values(isAvailable).some(Boolean);

  const renderTabContent = () => {
    switch (selectedTab) {
      case "contactDetails":
        return <KeyValueDisplay data={deployerMetadata ?? []} />;
      case "verifiedDeployment":
        return <KeyValueDisplay data={verifiedDeploymentArguments ?? []} />;
      case "aztecScanNotes":
        return <KeyValueDisplay data={aztecScanNotes ?? []} />;
      case "contractClassArtifect":
        return selectedVersionWithArtifactRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <ArtifactJsonTab
            data={selectedVersionWithArtifactRes.data?.artifactJson}
            artifactHash={
              selectedVersionWithArtifactRes.data?.artifactHash ?? ""
            }
          />
        );
      case "contractClassArtifectExplorer":
        return selectedVersionWithArtifactRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <ArtifactExplorerTab
            data={selectedVersionWithArtifactRes.data?.artifactJson}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <OptionButtons
        options={verifiedDeploymentTabs}
        availableOptions={isAvailable}
        onOptionSelect={onOptionSelect}
        selectedItem={selectedTab}
      />
      {hasAnyAvailableOptions ?? (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col gap-4 md:flex-row ">
            <div className="bg-white w-full rounded-lg">
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
