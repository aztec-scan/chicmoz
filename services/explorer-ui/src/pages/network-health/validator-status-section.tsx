import { L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { useMemo, type FC } from "react";
import { useL1L2Validators } from "~/hooks/api/l1-l2-validator";
import { routes } from "~/routes/__root";

export const ValidatorStatusSection: FC = () => {
  const {
    data: validators,
    isLoading: validatorsLoading,
    error: validatorsError,
  } = useL1L2Validators();

  // Count validators for each status
  const validatorStatusCounts = useMemo(() => {
    if (!validators) {
      return [];
    }

    // Create a map to store counts for each status
    const counts = new Map<number, number>();

    // Count validators for each status
    validators.forEach((validator) => {
      const status = validator.status;
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });

    // Convert to array of [status, count] pairs
    return Array.from(counts.entries()).sort(
      ([statusA], [statusB]) => statusA - statusB,
    ); // Sort by status
  }, [validators]);

  // Get total validators count
  const totalValidators = validators?.length ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
      <h2 className="mb-4">Validators Status</h2>
      {validatorsLoading ? (
        <p>Loading validators...</p>
      ) : validatorsError ? (
        <p>Error loading validators: {validatorsError.message}</p>
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
                      {count} out of {totalValidators} validators (
                      {percentage}%) are in {statusName} status
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
            to={routes.validators.route}
            className="text-purple-light hover:underline self-end"
          >
            View all validators →
          </Link>
        </div>
      )}
    </div>
  );
};
