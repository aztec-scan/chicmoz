import { type ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { type UseQueryResult } from "@tanstack/react-query";
import { useState, type FC } from "react";
import { Loader } from "~/components/loader";
import { OptionButtons } from "~/components/option-buttons";
import { useDeployedContractInstances } from "~/hooks";
import { contractClassTabs, type TabId } from "./constants";
import { getDataFromMap } from "./display-utils";
import { ArtifactExplorerTab } from "./tabs/artifact-explorer-tab";
import { ContractInstancesTab } from "./tabs/contract-instances";
import { ContractVersionsTab } from "./tabs/contract-versions";
import { JsonTab } from "./tabs/json-tab";
import {
  getArtifactData,
  type SimpleArtifactData,
  type SimplifiedViewOfFunc,
} from "./util";

interface TabSectionProps {
  contractClasses: UseQueryResult<
    ChicmozL2ContractClassRegisteredEvent[],
    Error
  >;
  contractClassId: string;
  selectedVersion: ChicmozL2ContractClassRegisteredEvent | undefined;
  isContractArtifactLoading: boolean;
  contractArtifactError: Error | null;
}

export const TabSection: FC<TabSectionProps> = ({
  contractClasses,
  contractClassId,
  selectedVersion,
  isContractArtifactLoading,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabId>("contractVersions");
  const contractInstances = useDeployedContractInstances(contractClassId);
  const onOptionSelect = (value: string) => {
    setSelectedTab(value as TabId);
  };

  let artifact: SimpleArtifactData;
  let privFunc: SimplifiedViewOfFunc = new Map();
  let pubFunc: SimplifiedViewOfFunc = new Map();
  let uncFunc: SimplifiedViewOfFunc = new Map();

  if (selectedVersion?.artifactJson) {
    const artifactData = getArtifactData(selectedVersion);
    artifact = artifactData.artifact;
    privFunc = artifactData.privFunc;
    pubFunc = artifactData.pubFunc;
    uncFunc = artifactData.uncFunc;
  }

  const isOptionAvailable = {
    contractVersions: !!contractClasses && !!contractClasses.data?.length,
    contractInstances: !!contractInstances && !!contractInstances.data?.length,

    privateFunctions: !!selectedVersion && privFunc && privFunc.size > 1,
    unconstrainedFunctions: !!selectedVersion && uncFunc && uncFunc.size > 1,
    publicFunctions: !!selectedVersion && pubFunc && pubFunc.size > 1,
    artifactJson:
      !!selectedVersion &&
      (!!selectedVersion.artifactJson || isContractArtifactLoading),
    artifactExplorer:
      !!selectedVersion &&
      (!!selectedVersion.artifactJson || isContractArtifactLoading),
    functionJson: !!selectedVersion && !!selectedVersion.artifactJson,
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "contractVersions":
        return <ContractVersionsTab data={contractClasses} />;
      case "contractInstances":
        return <ContractInstancesTab data={contractInstances} />;
      case "privateFunctions":
        return <JsonTab data={getDataFromMap(privFunc)} />;
      case "unconstrainedFunctions":
        return <JsonTab data={getDataFromMap(uncFunc)} />;
      case "publicFunctions":
        return <JsonTab data={getDataFromMap(pubFunc)} />;
      case "artifactJson":
        return isContractArtifactLoading ? (
          <Loader amount={1} />
        ) : (
          <JsonTab data={artifact} />
        );
      case "artifactExplorer":
        return isContractArtifactLoading ? (
          <Loader amount={1} />
        ) : (
          <ArtifactExplorerTab data={artifact} />
        );
      default:
        return null;
    }
  };
  return (
    <>
      <OptionButtons
        options={contractClassTabs}
        availableOptions={isOptionAvailable}
        onOptionSelect={onOptionSelect}
        selectedItem={selectedTab}
      />
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col gap-4 md:flex-row ">
          <div className="bg-white w-full rounded-lg">{renderTabContent()}</div>
        </div>
      </div>
    </>
  );
};
