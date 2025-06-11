import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { OrphanedBanner } from "~/components/orphaned-banner";
import { useContractInstance, useSubTitle } from "~/hooks";
import { TabsSection } from "./tabs-section";
import {
  getContractData,
  getVerifiedContractInstanceDeploymentData,
} from "./util";

export const ContractInstanceDetails: FC = () => {
  const { address } = useParams({
    from: "/contracts/instances/$address",
  });
  useSubTitle(`Address ${address}`);
  const {
    data: contractInstanceDetails,
    isLoading,
    error,
  } = useContractInstance(address);

  if (!address) {
    return <div>No contract address</div>;
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    console.error("Error fetching contract instance details:", error);
    return <div>Error</div>;
  }
  if (!contractInstanceDetails) {
    return <div>No data</div>;
  }

  const { verifiedDeploymentArguments, deployerMetadata, aztecScanNotes } =
    getVerifiedContractInstanceDeploymentData(contractInstanceDetails);

  return (
    <div className="mx-auto px-[70px] max-w-[1440px]">
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-wrap m-3">
          <h3 className="mt-2 text-primary md:hidden">
            Contract instance details
          </h3>
          <h2 className="hidden md:block md:mt-6 md:text-primary">
            Contract instance details
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-8">
          {"isOrphaned" in contractInstanceDetails &&
          contractInstanceDetails.isOrphaned ? (
            <OrphanedBanner type="contract-instance" />
          ) : null}
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay data={getContractData(contractInstanceDetails)} />
          </div>
        </div>
      </div>
      {verifiedDeploymentArguments?.length ??
      deployerMetadata?.length ??
      aztecScanNotes?.length ? (
        <div className="mt-5">
          <TabsSection
            verifiedDeploymentData={verifiedDeploymentArguments}
            deployerMetadata={deployerMetadata}
            aztecScanNotes={aztecScanNotes}
          />
        </div>
      ) : null}
    </div>
  );
};
