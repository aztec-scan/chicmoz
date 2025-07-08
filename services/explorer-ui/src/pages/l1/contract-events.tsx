import { type FC } from "react";
import { ContractEventsTable } from "~/components/contract-events/contract-events-table";
import { useSubTitle } from "~/hooks";
import { useContractEvents } from "~/hooks/api/l1/contract-events";
import { BaseLayout } from "~/layout/base-layout";
import { routes } from "~/routes/__root";

export const ContractEventsPage: FC = () => {
  useSubTitle(routes.l1.children.contractEvents.title);
  const { data, isLoading, error } = useContractEvents();

  const sortedData = data?.sort(
    (a, b) => Number(b.l1BlockNumber) - Number(a.l1BlockNumber),
  );

  return (
    <BaseLayout>
      <div className="flex flex-wrap m-5">
        <h2 className="mt-2 text-primary dark:text-white md:hidden">
          L1 Contract Events
        </h2>
        <h2 className="hidden md:text-primary md:dark:text-white md:block md:mt-8">
          L1 Contract Events
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-lg w-full">
        <ContractEventsTable
          title="Contract Events"
          contractEvents={sortedData}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </BaseLayout>
  );
};
