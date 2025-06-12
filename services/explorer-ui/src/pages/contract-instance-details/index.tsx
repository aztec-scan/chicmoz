import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { KeyValueDisplay } from "~/components/info-display/key-value-display";
import { LoadingDetails } from "~/components/loading/loading-details";
import { getEmptyContractInstanceData } from "~/components/loading/util";
import { OrphanedBanner } from "~/components/orphaned-banner";
import { useChainInfo, useContractInstance, useSubTitle } from "~/hooks";
import { TabsSection } from "./tabs-section";
import { getContractData } from "./util";

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

  const { data: chainInfo } = useChainInfo();

  const isProtocolContract =
    chainInfo?.protocolContractAddresses &&
    Object.values(chainInfo.protocolContractAddresses).includes(address);

  if (!address) {
    return (
      <LoadingDetails
        title="No Contract instance address provided"
        description={"Please provided a correct hash"}
      />
    );
  }
  if (isLoading) {
    return (
      <LoadingDetails
        title="Loading Contract instances details"
        emptyData={getEmptyContractInstanceData()}
      />
    );
  }
  if (error) {
    <LoadingDetails
      title="Error fetching the contract-instance details"
      description={"Please try to reload the page"}
    />;
  }
  if (!contractInstanceDetails) {
    return (
      <LoadingDetails
        title="No Contract instance found"
        description={`Please check if the cotract instance address: ${address} is correct`}
      />
    );
  }

  const titleStr = isProtocolContract
    ? "Protocol contract"
    : "Contract instance details";

  return (
    <div className="mx-auto px-7 max-w-[1440px] md:px-[70px]">
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-wrap m-3">
          <h3 className="mt-2 text-primary md:hidden">{titleStr}</h3>
          <h2 className="hidden md:block md:mt-6 md:text-primary">
            {titleStr}
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-8">
          {"isOrphaned" in contractInstanceDetails &&
          contractInstanceDetails.isOrphaned ? (
            <OrphanedBanner type="contract-instance" />
          ) : null}
          <div className="bg-white rounded-lg shadow-md p-4">
            <KeyValueDisplay
              data={getContractData({
                data: contractInstanceDetails,
                isProtocolContract,
              })}
            />
          </div>
        </div>
      </div>
      <div className="mt-5">
        <TabsSection contractInstanceDetails={contractInstanceDetails} />
      </div>
    </div>
  );
};
