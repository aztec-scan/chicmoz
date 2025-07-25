import { type FC } from "react";
import { ContractClassesTable } from "~/components/contracts/classes/table";
import { ContractInstancesTable } from "~/components/contracts/instances/table";
import { InfoBadge } from "~/components/info-badge";
import {
  useLatestContractClasses,
  useLatestContractInstances,
  useSubTitle,
  useTotalContracts,
  useTotalContractsLast24h,
} from "~/hooks";
import { BaseLayout } from "~/layout/base-layout";
import { routes } from "~/routes/__root";
import { mapContractClasses, mapContractInstances } from "./util";

export const Contracts: FC = () => {
  useSubTitle(routes.contracts.children.index.title);
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    error: errorClasses,
  } = useLatestContractClasses();
  const {
    data: instancesData,
    isLoading: isLoadingInstances,
    error: errorInstances,
  } = useLatestContractInstances();
  const {
    data: totalAmountOfContracts,
    isLoading: loadingAmountContracts,
    error: errorAmountContracts,
  } = useTotalContracts();
  const {
    data: totalAmountOfContracts24h,
    isLoading: loadingAmountContracts24h,
    error: errorAmountContracts24h,
  } = useTotalContractsLast24h();
  return (
    <BaseLayout>
      <div className="flex flex-wrap m-5">
        <h2 className="mt-2 text-primary dark:text-white md:hidden">
          All Contracts
        </h2>
        <h2 className="hidden md:block md:text-primary md:dark:text-white md:mt-8">
          All Contracts
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 my-10 md:gap-5 ">
        <InfoBadge
          title="Total Contract Classes"
          isLoading={loadingAmountContracts}
          error={errorAmountContracts}
          data={totalAmountOfContracts}
        />
        <InfoBadge
          title="Total Contract Classes last 24h"
          isLoading={loadingAmountContracts24h}
          error={errorAmountContracts24h}
          data={totalAmountOfContracts24h}
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="bg-white rounded-lg shadow-lg w-full md:w-1/2">
          <ContractClassesTable
            title="Latest Contract Classes"
            contracts={mapContractClasses(classesData)}
            isLoading={isLoadingClasses}
            error={errorClasses}
            tooltip="A contract class is a collection of state variables and functions. It is just a reference to the code and can not be called."
          />
        </div>
        <div className="bg-white rounded-lg shadow-lg w-full md:w-1/2">
          <ContractInstancesTable
            title="Latest Contract Instances"
            contracts={mapContractInstances(instancesData)}
            isLoading={isLoadingInstances}
            error={errorInstances}
            tooltip="A contract instance is a specific deployment of a contract class. It has a state and can be called."
          />
        </div>
      </div>
    </BaseLayout>
  );
};
