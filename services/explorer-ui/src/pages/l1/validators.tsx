import { L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { InfoBadge } from "~/components/info-badge";
import { ValidatorsTable } from "~/components/validators/validators-table";
import { useSubTitle } from "~/hooks";
import { useL1L2Validators } from "~/hooks/api/l1-l2-validator";
import { routes } from "~/routes/__root";

export const ValidatorsPage: FC = () => {
  useSubTitle(routes.validators.title);
  const { data, isLoading, error } = useL1L2Validators();

  const validatingCount =
    data?.filter(
      (validator) => validator.status === L1L2ValidatorStatus.VALIDATING,
    ).length ?? 0;

  const exitingCount =
    data?.filter(
      (validator) => validator.status !== L1L2ValidatorStatus.VALIDATING,
    ).length ?? 0;

  const validatorsData = data;

  const sortedValidatorsData = validatorsData?.sort((a, b) => {
    const stakeDiff = Number(b.stake - a.stake);
    if (stakeDiff !== 0) {
      return stakeDiff;
    }
    return b.latestSeenChangeAt.getTime() - a.latestSeenChangeAt.getTime();
  });

  return (
    <div className="mx-auto px-5 max-w-[1440px] md:px-[70px]">
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
        />
      </div>
    </div>
  );
};
