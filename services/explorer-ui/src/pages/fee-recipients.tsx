import { type FC } from "react";
import { FeeReceipientsTable } from "~/components/fee-recipient/fee-recipient-table";
import { InfoBadge } from "~/components/info-badge";
import { useSubTitle } from "~/hooks";
import { useChainInfo } from "~/hooks/api";
import { useFeeRecipients } from "~/hooks/api/fee-recipient";
import { BaseLayout } from "~/layout/base-layout";
import { getFeeJuiceSymbol } from "~/lib/utils";
import { routes } from "~/routes/__root";

export const FeeRecipientPage: FC = () => {
  useSubTitle(routes.feeRecipients.title);
  const { data, isLoading, error } = useFeeRecipients();
  const { data: chainInfo } = useChainInfo();

  const getTotalReceived = data
    ? data.reduce((acc, cur) => {
        return acc + Number(cur.feesReceived);
      }, 0)
    : 0;
  return (
    <BaseLayout>
      <div className="flex flex-wrap m-5">
        <h2 className="text-primary dark:text-white mt-2 md:hidden">
          Fee Recipients
        </h2>
        <h2 className="hidden md:block md:text-primary md:dark:text-white md:mt-8">
          Fee Recipients
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 my-10 md:gap-5">
        <InfoBadge
          title="Amount of fee recipients"
          isLoading={isLoading}
          error={error}
          data={data ? data.length.toString() : ""}
        />
        <InfoBadge
          title={`Total amount fees received (${getFeeJuiceSymbol(
            chainInfo?.feeJuiceSymbol,
          )})`}
          isLoading={isLoading}
          error={error}
          data={getTotalReceived.toString()}
        />
      </div>
      <div className="rounded-lg shadow-lg">
        <FeeReceipientsTable
          feeRecipients={data}
          isLoading={isLoading}
          feeJuiceAddress={chainInfo?.l1ContractAddresses.feeJuiceAddress}
          feeJuiceDecimals={chainInfo?.feeJuiceDecimals}
          feeJuiceSymbol={chainInfo?.feeJuiceSymbol}
        />
      </div>
    </BaseLayout>
  );
};
