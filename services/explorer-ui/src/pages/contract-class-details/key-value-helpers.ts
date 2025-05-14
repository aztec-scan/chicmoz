import {
  ContractType,
  type ChicmozL2ContractClassRegisteredEvent,
} from "@chicmoz-pkg/types";
import { type DetailItem } from "~/components/info-display/key-value-display";
import { routes } from "~/routes/__root";
import { API_URL, aztecExplorer } from "~/service/constants";

export const getContractClassKeyValueData = (
  data: ChicmozL2ContractClassRegisteredEvent,
  instanceAmount?: string,
) => {
  const valueData: DetailItem[] = [
    {
      label: "BLOCK HASH",
      value: data.blockHash,
      link: `${routes.blocks.route}/${data.blockHash}`,
    },
    {
      label: "CLASS ID",
      value: data.contractClassId,
    },
    {
      label: "VERSION",
      value: data.version.toString(),
    },
    {
      label: "ARTIFACT HASH",
      value: data.artifactHash,
    },
    {
      label: "PRIVATE FUNCTIONS ROOT",
      value: data.privateFunctionsRoot,
    },
    {
      label: "RAW DATA",
      value: "View raw data",
      extLink: `${API_URL}/${aztecExplorer.getL2ContractClassByIdAndVersion(
        data.contractClassId,
        data.version.toString(),
      )}`,
    },
    {
      label: "INSTANCES DEPLOYED",
      value: instanceAmount,
    },
  ];

  if (data.contractType && data.contractType !== ContractType.Unknown) {
    valueData.push({
      label: "CONTRACT TYPE",
      value: data.contractType,
      tooltip: "Matched with DeFi-Wonderland's standard contracts",
    });
  }
  return valueData;
};
