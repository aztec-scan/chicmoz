import { type PublicCallRequest } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { PublicCallRequestsColumns } from "~/components/public-call-requests/public-call-requests-columns";

type Props = {
  publicCallRequests: PublicCallRequest[];
};

export const PublicCallRequestsTab: FC<Props> = ({ publicCallRequests }) => {
  if (publicCallRequests.length === 0) {
    return <p className="text-gray-500">No public call requests found.</p>;
  }

  return (
    <DataTable
      columns={PublicCallRequestsColumns}
      data={publicCallRequests}
      disableSizeSelector={false}
      maxEntries={20}
    />
  );
};
