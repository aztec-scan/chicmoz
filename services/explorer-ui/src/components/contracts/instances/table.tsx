import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { type FC } from "react";
import { CustomTooltip } from "~/components/custom-tooltip";
import { DataTable } from "~/components/data-table";
import { contractsTableColumns } from "./columns";
import { type ContractInstance } from "./schema";

interface Props {
  title?: string;
  contracts?: ContractInstance[];
  isLoading: boolean;
  error?: Error | null;
  showContractVersions?: boolean;
  tooltip?: string;
}

export const ContractInstancesTable: FC<Props> = ({
  title,
  contracts,
  isLoading,
  error,
  showContractVersions,
  tooltip,
}) => {
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
        {title && (
          <h3 className="ml-0.5 flex items-center gap-2">
            {title}
            {tooltip && (
              <CustomTooltip content={tooltip}>
                <QuestionMarkCircledIcon className="text-gray-400 cursor-pointer" />
              </CustomTooltip>
            )}
          </h3>
        )}
        <DataTable
          isLoading={isLoading}
          data={contracts ?? []}
          columns={cols}
        />
      </div>
    </section>
  );
};
