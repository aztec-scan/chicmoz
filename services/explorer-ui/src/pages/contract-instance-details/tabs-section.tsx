import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { useState, type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { Loader } from "~/components/loader";
import { OptionButtons } from "~/components/option-buttons";
import {
  useChainInfo,
  useContractClass,
  useContractInstanceBalanceHistory,
  usePublicCallRequestsByContract,
  useL2ToL1MsgsByContract,
  useFeeJuicePortalDepositsByAddress,
} from "~/hooks";
import { type SimpleArtifactData } from "../contract-class-details/artifact-parser";
import { ArtifactExplorerTab } from "../contract-class-details/tabs/artifact-explorer-tab";
import { ArtifactJsonTab } from "../contract-class-details/tabs/artifact-json-tab";
import { FeeJuiceBalance } from "./feejuice-balance";
import { FeeJuicePortalDepositsTab } from "./tabs/fee-juice-portal-deposits-tab";
import { L2ToL1MsgsTab } from "./tabs/l2-to-l1-msgs-tab";
import { PublicCallRequestsTab } from "./tabs/public-call-requests-tab";
import { verifiedDeploymentTabs, type TabId } from "./types";
import { getVerifiedContractInstanceDeploymentData } from "./util";

interface PillSectionProps {
  contractInstanceDetails: ChicmozL2ContractInstanceDeluxe;
}
export const TabsSection: FC<PillSectionProps> = ({
  contractInstanceDetails,
}) => {
  const { data: chainInfo } = useChainInfo();
  const { verifiedDeploymentArguments, deployerMetadata, aztecScanNotes } =
    getVerifiedContractInstanceDeploymentData(contractInstanceDetails);

  const selectedVersionWithArtifactRes = useContractClass({
    classId: contractInstanceDetails.originalContractClassId,
    version: contractInstanceDetails.version.toString(),
    includeArtifactJson: true,
  });

  const balanceHistoryRes = useContractInstanceBalanceHistory(
    contractInstanceDetails.address,
  );

  const publicCallRequestsRes = usePublicCallRequestsByContract(
    contractInstanceDetails.address,
  );

  const l2ToL1MsgsRes = useL2ToL1MsgsByContract(
    contractInstanceDetails.address,
  );

  const feeJuiceDepositsRes = useFeeJuicePortalDepositsByAddress(
    contractInstanceDetails.address,
  );

  const [selectedTab, setSelectedTab] = useState<TabId>("feeJuiceBalance");
  const onOptionSelect = (value: string) => {
    setSelectedTab(value as TabId);
  };

  const isAvailable = {
    verifiedDeployment: !!verifiedDeploymentArguments,
    contactDetails: !!deployerMetadata,
    aztecScanNotes: !!aztecScanNotes,
    contractClassArtifact: !!selectedVersionWithArtifactRes.data?.artifactJson,
    contractClassArtifactExplorer:
      !!selectedVersionWithArtifactRes.data?.artifactJson,
    feeJuiceBalance:
      !!balanceHistoryRes.data && balanceHistoryRes.data.length > 0,
    publicCallRequests:
      !!publicCallRequestsRes.data && publicCallRequestsRes.data.length > 0,
    l2ToL1Msgs: !!l2ToL1MsgsRes.data && l2ToL1MsgsRes.data.length > 0,
    feeJuiceDeposits:
      !!feeJuiceDepositsRes.data && feeJuiceDepositsRes.data.length > 0,
  };

  // Check if any options are available
  const hasAnyAvailableOptions = Object.values(isAvailable).some(Boolean);

  const renderTabContent = () => {
    switch (selectedTab) {
      case "feeJuiceBalance":
        return balanceHistoryRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <FeeJuiceBalance
            historyData={balanceHistoryRes.data ?? []}
            feeJuiceDecimals={chainInfo?.feeJuiceDecimals}
            feeJuiceSymbol={chainInfo?.feeJuiceSymbol}
          />
        );
      case "contactDetails":
        return <KeyValueDisplay data={deployerMetadata ?? []} />;
      case "verifiedDeployment":
        return <KeyValueDisplay data={verifiedDeploymentArguments ?? []} />;
      case "aztecScanNotes":
        return <KeyValueDisplay data={aztecScanNotes ?? []} />;
      case "contractClassArtifact":
        return selectedVersionWithArtifactRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <ArtifactJsonTab
            data={
              JSON.parse(
                selectedVersionWithArtifactRes.data?.artifactJson ?? "{}",
              ) as SimpleArtifactData
            }
            artifactHash={
              selectedVersionWithArtifactRes.data?.artifactHash ?? ""
            }
          />
        );
      case "contractClassArtifactExplorer":
        return selectedVersionWithArtifactRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <ArtifactExplorerTab
            data={selectedVersionWithArtifactRes.data?.artifactJson}
          />
        );
      case "publicCallRequests":
        return publicCallRequestsRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <PublicCallRequestsTab
            publicCallRequests={publicCallRequestsRes.data ?? []}
          />
        );
      case "l2ToL1Msgs":
        return l2ToL1MsgsRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <L2ToL1MsgsTab messages={l2ToL1MsgsRes.data ?? []} />
        );
      case "feeJuiceDeposits":
        return feeJuiceDepositsRes.isLoading ? (
          <Loader amount={1} />
        ) : (
          <FeeJuicePortalDepositsTab
            deposits={feeJuiceDepositsRes.data ?? []}
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
      {hasAnyAvailableOptions && (
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
