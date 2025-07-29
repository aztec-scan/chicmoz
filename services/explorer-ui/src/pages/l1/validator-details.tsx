import { type ChicmozL1L2Validator } from "@chicmoz-pkg/types";
import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { EtherscanAddressLink } from "~/components/etherscan-address-link";
import {
  KeyValueDisplay,
  type DetailItem,
} from "~/components/info-display/key-value-display";
import { ValidatorStatusBadge } from "~/components/validator-status-badge";
import { ValidatorHistoryTable } from "~/components/validators/validator-history-table";
import { useSubTitle } from "~/hooks";
import {
  useL1L2Validator,
  useL1L2ValidatorHistory,
} from "~/hooks/api/l1-l2-validator";
import { BaseLayout } from "~/layout/base-layout";
import { routes } from "~/routes/__root";
import { API_URL, aztecExplorer } from "~/service/constants";

const getValidatorData = (validator: ChicmozL1L2Validator): DetailItem[] => {
  return [
    {
      label: "STATUS",
      value: "CUSTOM",
      customValue: <ValidatorStatusBadge status={validator.status} />,
    },
    {
      label: "Stake",
      value: (Number(validator.stake) / 10 ** 18).toFixed(2),
    },
    {
      label: "ATTESTER",
      value: "CUSTOM",
      customValue: (
        <EtherscanAddressLink
          content={validator.attester}
          endpoint={`/address/${validator.attester}`}
        />
      ),
    },
    {
      label: "WITHDRAWER",
      value: "CUSTOM",
      customValue: (
        <EtherscanAddressLink
          content={validator.withdrawer}
          endpoint={`/address/${validator.withdrawer}`}
        />
      ),
    },
    {
      label: "PROPOSER",
      value: "CUSTOM",
      customValue: (
        <EtherscanAddressLink
          content={validator.proposer}
          endpoint={`/address/${validator.proposer}`}
        />
      ),
    },
    {
      label: "FIRST SEEN",
      value: validator.firstSeenAt.toString(),
      timestamp: validator.firstSeenAt,
    },
    {
      label: "LATEST CHANGE",
      value: validator.latestSeenChangeAt.toString(),
      timestamp: validator.latestSeenChangeAt,
    },
    {
      label: "RAW DATA",
      value: "View raw data",
      extLink: `${API_URL}${aztecExplorer.getL1L2Validator(
        validator.attester,
      )}`,
    },
  ];
};

export const ValidatorDetailsPage: FC = () => {
  useSubTitle(routes.validators.children.attesterAddress.title);
  const { attesterAddress } = useParams({
    from: "/l1/validators/$attesterAddress",
  });
  const { data, isLoading, error } = useL1L2Validator(attesterAddress);
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useL1L2ValidatorHistory(attesterAddress);

  return (
    <BaseLayout>
      <div>
        <div className="flex flex-wrap m-3">
          <h3 className="text-primary md:hidden">Validator Details</h3>
          <h2 className="hidden md:block md:mt-8 md:text-primary">
            Validator Details
          </h2>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            {isLoading ? (
              <p>Loading validator details...</p>
            ) : error ? (
              <p className="text-red-500">Error: {error.message}</p>
            ) : data ? (
              <KeyValueDisplay data={getValidatorData(data)} />
            ) : (
              <p>No validator data found</p>
            )}
          </div>

          <ValidatorHistoryTable
            title="Validator History"
            attesterAddress={attesterAddress}
            history={historyData}
            isLoading={isHistoryLoading}
            error={historyError}
            maxEntries={20}
          />
        </div>
      </div>
    </BaseLayout>
  );
};
