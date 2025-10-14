import { type FC, useState } from "react";
import { InfoBadge } from "~/components/info-badge";
import { ValidatorsTable } from "~/components/validators/validators-table";
import { useSubTitle } from "~/hooks";
import {
  usePaginatedValidators,
  useValidatorTotals,
} from "~/hooks/api/l1-l2-validator";
import { BaseLayout } from "~/layout/base-layout";
import { routes } from "~/routes/__root";

export const ValidatorsPage: FC = () => {
  useSubTitle(routes.validators.title);

  // State for React Query pagination
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);

  const { data, isLoading, error } = usePaginatedValidators(
    currentPage,
    pageSize,
  );

  const { data: totalsData } = useValidatorTotals();

  // Determine if there's a next page based on data length
  const hasNextPage = data ? data.length === pageSize : true;
  const hasPreviousPage = currentPage > 0;

  const validatingCount = totalsData?.validating ?? 0;
  const exitingCount = totalsData?.nonValidating ?? 0;

  const validatorsData = data;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page
  };

  const sortedValidatorsData = validatorsData?.sort((a, b) => {
    const stakeDiff = Number(b.stake - a.stake);
    if (stakeDiff !== 0) {
      return stakeDiff;
    }
    return b.latestSeenChangeAt - a.latestSeenChangeAt;
  });

  return (
    <BaseLayout>
      <div className="flex flex-wrap m-5">
        <h2 className="mt-2 text-primary dark:text-white md:hidden">
          Validators
        </h2>
        <h2 className="hidden md:text-primary md:dark:text-white md:block md:mt-8">
          Validators
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 my-10 md:gap-5">
        <InfoBadge
          title="Validating Validators"
          isLoading={isLoading}
          error={error}
          data={validatingCount.toString()}
        />
        <InfoBadge
          title="Non-Validating Validators"
          isLoading={isLoading}
          error={error}
          data={exitingCount.toString()}
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg w-full">
        <ValidatorsTable
          title="All Validators"
          validators={sortedValidatorsData}
          isLoading={isLoading}
          error={error}
          maxEntries={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          useReactQueryPagination={true}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
        />
      </div>
    </BaseLayout>
  );
};
