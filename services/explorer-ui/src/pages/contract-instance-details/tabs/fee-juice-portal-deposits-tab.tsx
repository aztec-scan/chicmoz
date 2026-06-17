import { type ChicmozL1FeeJuicePortalDeposit } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { FeeJuicePortalDepositsColumns } from "~/components/fee-juice-portal-deposits/fee-juice-portal-deposits-columns";

type Props = {
  deposits: ChicmozL1FeeJuicePortalDeposit[];
};

export const FeeJuicePortalDepositsTab: FC<Props> = ({ deposits }) => {
  if (deposits.length === 0) {
    return (
      <p className="text-gray-500">
        No L1→L2 fee juice deposits found for this address.
      </p>
    );
  }

  return (
    <DataTable
      columns={FeeJuicePortalDepositsColumns}
      data={deposits}
      disableSizeSelector={false}
      maxEntries={20}
    />
  );
};
