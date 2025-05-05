import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { type UseQueryResult } from "@tanstack/react-query";
import { type FC } from "react";
import { ContractInstancesTable } from "~/components/contracts/instances/table";
import { mapContractInstances } from "~/pages/contract/util";

interface ContractInstancesProps {
  data: UseQueryResult<ChicmozL2ContractInstanceDeluxe[], Error>;
}
export const ContractInstancesTab: FC<ContractInstancesProps> = ({ data }) => {
  const {
    data: instancesData,
    isLoading: isLoadingInstances,
    error: errorInstances,
  } = data;
  const description = `Total amount of instances: ${instancesData?.length}`;
  return (
    <ContractInstancesTable
      title="Latest Contract Instances"
      description={description}
      contracts={mapContractInstances(instancesData)}
      isLoading={isLoadingInstances}
      error={errorInstances}
    />
  );
};
