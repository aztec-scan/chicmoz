import { type ChicmozL2PendingL2ToL1Msg } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { L2ToL1MsgsColumns } from "~/components/l2-to-l1-msgs/l2-to-l1-msgs-columns";

type Props = {
  messages: ChicmozL2PendingL2ToL1Msg[];
};

export const L2ToL1MsgsTab: FC<Props> = ({ messages }) => {
  if (messages.length === 0) {
    return <p className="text-gray-500">No L2→L1 messages found.</p>;
  }

  return (
    <DataTable
      columns={L2ToL1MsgsColumns}
      data={messages}
      disableSizeSelector={false}
      maxEntries={20}
    />
  );
};
