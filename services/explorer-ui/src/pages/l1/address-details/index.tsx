import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { LoadingDetails } from "~/components/loading/loading-details";
import { useL2ToL1MsgsByRecipient } from "~/hooks/api";
import { BaseLayout } from "~/layout/base-layout";
import { L2ToL1MsgsTab } from "~/pages/contract-instance-details/tabs/l2-to-l1-msgs-tab";

export const L1AddressDetails: FC = () => {
  const { address } = useParams({ from: "/l1/address/$address" });

  const {
    data: messages,
    isLoading,
    error,
  } = useL2ToL1MsgsByRecipient(address);

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
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-wrap m-3">
          <h2 className="hidden md:block md:mt-6 md:text-primary">
            L1 Address Activity
          </h2>
          <h3 className="mt-2 text-primary md:hidden">L1 Address Activity</h3>
          <p className="w-full mt-2 font-mono text-sm break-all text-gray-600">
            {address}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="text-lg font-semibold mb-4">L2→L1 Messages</h4>
          <L2ToL1MsgsTab messages={messages ?? []} />
        </div>
      </div>
    </BaseLayout>
  );
};
