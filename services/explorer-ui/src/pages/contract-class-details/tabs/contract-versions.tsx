import { ChicmozL2ContractClassRegisteredEvent, ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { UseQueryResult } from "@tanstack/react-query";
import { FC } from "react";
import { ContractClassesTable } from "~/components/contracts/classes/table";
import { mapContractClasses } from "~/pages/contract/util";

interface ContractVersionsProps {
  data: UseQueryResult<ChicmozL2ContractClassRegisteredEvent[], Error>
}
export const ContractVersionsTab: FC<ContractVersionsProps> = ({ data }) => {

  if (!data) return <div>no data</div>
  const { data: classesData, isLoading: isLoadingInstances, error: errorInstances } = data
  return <ContractClassesTable
    title="Latest Contract Classes"
    contracts={mapContractClasses(classesData)}
    isLoading={isLoadingInstances}
    error={errorInstances}
    showContractVersions={true}
  />
}
