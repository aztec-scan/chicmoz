import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { type ContractInstance } from "./schema";
import { contractsTableColumns } from "./columns";

interface Props {
  title?: string;
  description?: string;
  contracts?: ContractInstance[];
  isLoading: boolean;
  error?: Error | null;
  showContractVersions?: boolean;
}

export const ContractInstancesTable: FC<Props> = ({
  title,
  contracts,
  description,
  isLoading,
  error,
  showContractVersions,
}) => {
  if (!contracts) {
    return <div>No data</div>;
  }
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }
  let cols = contractsTableColumns;
  if (!showContractVersions) {
    cols = contractsTableColumns.filter((column) => {
      return (column as { accessorKey: string }).accessorKey !== "version";
    });
  }
  return (
    <section className="relative mx-auto w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        {title && <h3 className="ml-0.5">{title}</h3>}
        {description && <p className="text-sm text-primary">{description}</p>}
        <DataTable isLoading={isLoading} data={contracts} columns={cols} />
      </div>
    </section>
  );
};
