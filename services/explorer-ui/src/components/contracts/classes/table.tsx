import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { type ContractClass } from "./schema";
import { contractsTableColumns } from "./columns";

interface Props {
  title?: string;
  contracts?: ContractClass[];
  isLoading: boolean;
  error?: Error | null;
  showContractVersions?: boolean;
}

export const ContractClassesTable: FC<Props> = ({
  title,
  contracts,
  isLoading,
  error,
  showContractVersions,
}) => {
  if (!contracts) return <div>No data</div>;
  if (error) return <p className="text-red-500">{error.message}</p>;
  let cols = contractsTableColumns;
  if (!showContractVersions) {
    cols = contractsTableColumns.filter((column) => {
      return (column as { accessorKey: string }).accessorKey !== "version";
    });
  }

  return (
    <section className="relative mx-auto w-full transition-all">
      <DataTable
        isLoading={isLoading}
        title={title}
        data={contracts}
        columns={cols}
      />
    </section>
  );
};
