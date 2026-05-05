import { useParams } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { DataTable } from "~/components/data-table";
import { EtherscanAddressLink } from "~/components/etherscan-address-link";
import { L2ToL1MsgsColumnsWithoutRecipient } from "~/components/l2-to-l1-msgs/l2-to-l1-msgs-columns";
import { LoadingDetails } from "~/components/loading/loading-details";
import { useL2ToL1MsgsByRecipient } from "~/hooks/api";
import { BaseLayout } from "~/layout/base-layout";
import { cn } from "~/lib/utils";

type StatCardProps = { label: string; value: number | string };

const StatCard: FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-1">
    <span className="text-2xl font-bold text-primary">{value}</span>
    <span className="text-xs text-gray-500 uppercase tracking-wide">
      {label}
    </span>
  </div>
);

export const L1AddressDetails: FC = () => {
  const { address } = useParams({ from: "/l1/address/$address" });

  const {
    data: messages,
    isLoading,
    error,
  } = useL2ToL1MsgsByRecipient(address);

  const stats = useMemo(() => {
    const msgs = messages ?? [];
    return {
      totalMessages: msgs.length,
      uniqueContracts: new Set(msgs.map((m) => m.contractAddress)).size,
      uniqueTxHashes: new Set(msgs.map((m) => m.txHash)).size,
    };
  }, [messages]);

  if (!address) {
    return (
      <LoadingDetails
        title="No address provided"
        description="Please provide a correct address"
      />
    );
  }

  if (isLoading) {
    return <LoadingDetails title="Loading L1 address activity" />;
  }

  if (error) {
    return (
      <LoadingDetails
        title="Error fetching L1 address activity"
        description="Please try to reload the page"
      />
    );
  }

  return (
    <BaseLayout>
      <div className={cn("flex flex-col gap-6 mt-8 mx-3")}>
        <div>
          <h2 className="hidden md:block md:mt-6 md:text-primary">
            L1 Address Activity
          </h2>
          <h3 className="mt-2 text-primary md:hidden">L1 Address Activity</h3>
          <p className="font-mono text-sm break-all text-gray-600">{address}</p>
          <div className="mt-2">
            <EtherscanAddressLink
              content="View on Etherscan"
              endpoint={`/address/${address}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Messages" value={stats.totalMessages} />
          <StatCard label="Unique Contracts" value={stats.uniqueContracts} />
          <StatCard label="Unique Tx Hashes" value={stats.uniqueTxHashes} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="text-lg font-semibold mb-4">L2→L1 Messages</h4>
          <DataTable
            columns={L2ToL1MsgsColumnsWithoutRecipient}
            data={messages ?? []}
            disableSizeSelector={false}
            maxEntries={20}
          />
        </div>
      </div>
    </BaseLayout>
  );
};
