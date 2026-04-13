import { type FC } from "react";
import { DataTable } from "~/components/data-table";
import { ValidatorsTableColumns } from "./validators-columns";
import { type ChicmozL1L2Validator } from "@chicmoz-pkg/types";

interface Props {
  title?: string;
  validators?: ChicmozL1L2Validator[];
  isLoading?: boolean;
  error?: Error;
  disableSizeSelector?: boolean;
  disablePagination?: boolean;
  maxEntries?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  useReactQueryPagination?: boolean;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  totalCount?: number;
}

export const ValidatorsTable: FC<Props> = ({
  title,
  validators,
  isLoading,
  error,
  disableSizeSelector,
  disablePagination = false,
  maxEntries = 10,
  currentPage,
  onPageChange,
  onPageSizeChange,
  useReactQueryPagination = false,
  hasNextPage,
  hasPreviousPage,
  totalCount,
}) => {
  if (!validators) {
    return <div>No data</div>;
  }
  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }
  return (
    <section className="relative mx-0 w-full transition-all">
      <div className="space-y-4 bg-white rounded-lg p-5">
        {title && (
          <div className="flex flex-col md:flex-row gap-3 justify-between md:min-h-16 items-start md:items-center">
            <h3 className="ml-0.5">{title}</h3>
          </div>
        )}
        <DataTable
          isLoading={isLoading}
          data={validators}
          columns={ValidatorsTableColumns}
          disableSizeSelector={disableSizeSelector}
          disablePagination={disablePagination}
          maxEntries={maxEntries}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          useReactQueryPagination={useReactQueryPagination}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          totalCount={totalCount}
        />
      </div>
    </section>
  );
};
