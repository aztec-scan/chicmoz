import { type ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { type DetailItem } from "~/components/info-display/key-value-display";
import { routes } from "~/routes/__root";
import { API_URL, aztecExplorer } from "~/service/constants";

export const getContractClassKeyValueData = (
  data: ChicmozL2ContractClassRegisteredEvent,
  instanceAmount?: string,
) => {
  const sourceCode = data.sourceCodeUrl
    ? {
        label: "SOURCE CODE URL",
        value: "View source code",
        extLink: data.sourceCodeUrl,
      }
    : {
        label: "SOURCE CODE URL",
        value: "CUSTOM",
        customValue: <div className="text-gray-500">Not available</div>,
      };
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
      label: "INSTANCES DEPLOYED",
      value: instanceAmount,
    },
    {
      label: "RAW DATA",
      value: "View raw data",
      extLink: `${API_URL}${aztecExplorer.getL2ContractClassByIdAndVersion(
        data.contractClassId,
        data.version.toString(),
      )}`,
    },
    sourceCode,
  ];
  if (data.standardContractType) {
    valueData.push({
      label: "CONTRACT TYPE",
      value: data.standardContractType,
      tooltip: "Matched with DeFi-Wonderland's standard contracts",
    });
  }
  return valueData;
};
