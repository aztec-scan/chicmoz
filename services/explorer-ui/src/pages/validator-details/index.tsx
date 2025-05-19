import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { KeyValueRow } from "~/components/info-display/key-value-row";
import { ValidatorHistoryTable } from "~/components/validators/validator-history-table";
import { useSubTitle } from "~/hooks";
import {
  useL1L2Validator,
  useL1L2ValidatorHistory,
} from "~/hooks/api/l1-l2-validator";
import { routes } from "~/routes/__root";
import { getValidatorData, type ValidatorDataItem } from "./utils";

export const ValidatorDetailsPage: FC = () => {
  useSubTitle(routes.validators.children.attesterAddress.title);
  const { attesterAddress } = useParams({
    from: "/validators/$attesterAddress",
  });
  const { data, isLoading, error } = useL1L2Validator(attesterAddress);
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useL1L2ValidatorHistory(attesterAddress);

  return (
    <div className="mx-auto px-7 max-w-[1440px] md:px-[70px]">
      <div>
        <div className="flex flex-wrap m-3">
          <h3 className="text-primary md:hidden">Validator Details</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">
            Validator Details
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {/* Validator Info Card */}
          <div className="bg-white rounded-lg shadow-md p-4">
            {isLoading ? (
              <p>Loading validator details...</p>
            ) : error ? (
              <p className="text-red-500">Error: {error.message}</p>
            ) : data ? (
              <div>
                {getValidatorData(data).map(
                  (item: ValidatorDataItem, index, arr) => (
                    <KeyValueRow
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      timestamp={item.timestamp}
                      link={item.link}
                      extLink={item.extLink}
                      isLast={index === arr.length - 1}
                    />
                  ),
                )}
              </div>
            ) : (
              <p>No validator data found</p>
            )}
          </div>

          {/* History Table */}
          <ValidatorHistoryTable
            title="Validator History"
            history={historyData}
            isLoading={isHistoryLoading}
            error={historyError}
            maxEntries={20}
          />
        </div>
      </div>
    </div>
  );
};
