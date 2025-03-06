import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { BlockTableColumns } from "./block-table-columns";
import { type BlockTableSchema } from "./blocks-schema";

interface Props {
  title?: string;
  blocks?: BlockTableSchema[];
  isLoading: boolean;
  error?: Error | null;
  disableSizeSelector?: boolean;
  togglePendingTxCallback?: () => void;
}

// TODO: Maybe make this a generic component
export const BlocksTable: FC<Props> = ({
  title,
  blocks,
  isLoading,
  error,
  disableSizeSelector,
  togglePendingTxCallback
}) => {
  if (error) { return <p className="text-red-500">{error.message}</p>; }

  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        {title && <h3 className="ml-0.5">{title}</h3>}
        <DataTable
          isLoading={isLoading}
          data={blocks ?? []}
          columns={BlockTableColumns}
          disableSizeSelector={disableSizeSelector}
        />
      </div>
    </section>
  );
};
