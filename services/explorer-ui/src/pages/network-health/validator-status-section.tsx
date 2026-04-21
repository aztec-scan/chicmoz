import { L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { useValidatorTotals } from "~/hooks/api/l1-l2-validator";
import { routes } from "~/routes/__root";

export const ValidatorStatusSection: FC = () => {
  const {
    data: validatorTotals,
    isLoading: validatorTotalsLoading,
    error: validatorTotalsError,
  } = useValidatorTotals();

  const validatorStatusCounts = useMemo(() => {
    if (!validatorTotals) {
      return [] as Array<readonly [number, number]>;
    }

    const entries: Array<readonly [number, number]> = [];

    for (const [statusName, count] of Object.entries(
      validatorTotals.statusCounts,
    )) {
      const status =
        L1L2ValidatorStatus[statusName as keyof typeof L1L2ValidatorStatus];
      const countValue = typeof count === "number" ? count : Number(count);

      if (typeof status === "number" && Number.isFinite(countValue)) {
        entries.push([status, countValue]);
      }
    }

    return entries.sort(([statusA], [statusB]) => statusA - statusB);
  }, [validatorTotals]);

  const totalValidators = validatorTotals?.total ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Validators Status</h2>
      {validatorTotalsLoading ? (
        <p>Loading validators...</p>
      ) : validatorTotalsError ? (
        <p>Error loading validators: {validatorTotalsError.message}</p>
      ) : (
        <div className="flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Validator Summary</h3>
            {totalValidators > 0 ? (
              <div className="space-y-2">
                {validatorStatusCounts.map(([status, count]) => {
                  // Get status name from enum - this works because TypeScript numeric enums
                  // are bidirectional (value to name mapping is also available)
                  const statusName =
                    L1L2ValidatorStatus[status] || `Status ${status}`;
                  const percentage = Math.round(
                    (count / totalValidators) * 100,
                  );

                  return (
                    <p
                      key={status}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      {count} out of {totalValidators} validators ({percentage}
                      %) are in {statusName} status
                    </p>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No validators found
              </p>
            )}
          </div>
          <Link
            to={`${routes.l1.route}/${routes.validators.route}`}
            className="text-purple-light hover:underline self-end"
          >
            View all validators →
          </Link>
        </div>
      )}
    </div>
  );
};
