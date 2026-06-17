import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { FeeJuicePortalDepositsColumns } from "~/components/fee-juice-portal-deposits/fee-juice-portal-deposits-columns";
import { LoadingDetails } from "~/components/loading/loading-details";
import { useFeeJuicePortalDepositsByAddress, usePublicCallRequestsBySender } from "~/hooks/api";
import { BaseLayout } from "~/layout/base-layout";
import { cn } from "~/lib/utils";
import { AddressActivityColumns } from "./address-activity-columns";

type StatCardProps = { label: string; value: number | string };

const StatCard: FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-1">
    <span className="text-2xl font-bold text-primary">{value}</span>
    <span className="text-xs text-gray-500 uppercase tracking-wide">
      {label}
    </span>
  </div>
);

export const AddressDetails: FC = () => {
  const { address } = useParams({ from: "/address/$address" });

  const {
    data: publicCallRequests,
    isLoading,
    error,
  } = usePublicCallRequestsBySender(address);

  const { data: feeJuiceDeposits, isLoading: isLoadingDeposits } =
    useFeeJuicePortalDepositsByAddress(address);

  if (!address) {
    return (
      <LoadingDetails
        title="No address provided"
        description="Please provide a correct address"
      />
    );
  }

  if (isLoading) {
    return <LoadingDetails title="Loading address activity" />;
  }

  if (error) {
    return (
      <LoadingDetails
        title="Error fetching address activity"
        description="Please try to reload the page"
      />
    );
  }

  const totalCalls = publicCallRequests?.length ?? 0;
  const uniqueContracts = new Set(
    publicCallRequests?.map((r) => r.contractAddress),
  ).size;
  const staticCallCount =
    publicCallRequests?.filter((r) => r.isStaticCall).length ?? 0;
  const totalDeposits = feeJuiceDeposits?.length ?? 0;

  return (
    <BaseLayout>
      <div className={cn("flex flex-col gap-6 mt-8 mx-3")}>
        <div>
          <h2 className="hidden md:block md:mt-6 md:text-primary">
            Address Activity
          </h2>
          <h3 className="mt-2 text-primary md:hidden">Address Activity</h3>
          <p className="font-mono text-sm break-all text-gray-600">{address}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Calls" value={totalCalls} />
          <StatCard label="Unique Contracts" value={uniqueContracts} />
          <StatCard label="Static Calls" value={staticCallCount} />
          <StatCard label="L1 Fee Juice Deposits" value={totalDeposits} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="text-lg font-semibold mb-4">Public Call Requests</h4>
          <DataTable
            columns={AddressActivityColumns}
            data={publicCallRequests ?? []}
            disableSizeSelector={false}
            maxEntries={20}
          />
        </div>

        {(isLoadingDeposits || totalDeposits > 0) && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h4 className="text-lg font-semibold mb-4">
              L1→L2 Fee Juice Deposits
            </h4>
            {isLoadingDeposits ? (
              <p className="text-gray-500 text-sm">Loading deposits…</p>
            ) : (
              <DataTable
                columns={FeeJuicePortalDepositsColumns}
                data={feeJuiceDeposits ?? []}
                disableSizeSelector={false}
                maxEntries={20}
              />
            )}
          </div>
        )}
      </div>
    </BaseLayout>
  );
};
