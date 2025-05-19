import { type ChicmozL1L2Validator } from "@chicmoz-pkg/types";
import { routes } from "~/routes/__root";

export interface ValidatorDataItem {
  label: string;
  value: string;
  status?: number;
  link?: string;
  etherscan?: boolean;
  eth?: boolean;
  timestamp?: number;
  extLink?: string;
}

export const getValidatorData = (
  validator: ChicmozL1L2Validator,
): ValidatorDataItem[] => {
  return [
    {
      label: "STATUS",
      value: validator.status.toString(),
      status: validator.status,
    },
    {
      label: "ATTESTER ADDRESS",
      value: validator.attester,
      link: `${routes.validators.route}/${validator.attester}`,
      etherscan: true,
    },
    {
      label: "WITHDRAWER",
      value: validator.withdrawer,
      etherscan: true,
    },
    {
      label: "PROPOSER",
      value: validator.proposer,
      etherscan: true,
    },
    {
      label: "STAKE (ETH)",
      value: (Number(validator.stake) / 10 ** 18).toFixed(4),
      eth: true,
    },
    {
      label: "FIRST SEEN",
      value: validator.firstSeenAt.toString(),
      timestamp: validator.firstSeenAt.getTime(),
    },
    {
      label: "LATEST CHANGE",
      value: validator.latestSeenChangeAt.toString(),
      timestamp: validator.latestSeenChangeAt.getTime(),
    },
  ];
};
