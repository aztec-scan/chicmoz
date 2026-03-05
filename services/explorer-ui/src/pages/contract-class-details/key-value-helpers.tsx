import { type ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { CustomTooltip } from "~/components/custom-tooltip";
import { type DetailItem } from "~/components/info-display/key-value-display";
import { routes } from "~/routes/__root";
import { API_URL, aztecExplorer } from "~/service/constants";

export const getContractClassKeyValueData = (
  data: ChicmozL2ContractClassRegisteredEvent,
  instanceAmount?: string,
) => {
  const sourceCode = data.sourceCodeUrl
    ? {
        label: "SOURCE CODE",
        value: "CUSTOM",
        customValue: (
          <div className="flex items-center gap-2 justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Verified
            </span>
            <a
              href={data.sourceCodeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline text-sm"
            >
              View source
            </a>
          </div>
        ),
      }
    : {
        label: "SOURCE CODE",
        value: "CUSTOM",
        customValue: (
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            Not verified
          </div>
        ),
      };

  const standardContractType = data.standardContractType
    ? {
        label: "STANDARD CONTRACT TYPE",
        value: `${data.standardContractType}${
          data.standardContractVersion
            ? ` v${data.standardContractVersion}`
            : ""
        }`,
        tooltip: "Matched with DeFi-Wonderland's standard contracts",
      }
    : {
        label: "STANDARD CONTRACT TYPE",
        value: "CUSTOM",
        customValue: (
          <div className="text-gray-400 dark:text-gray-500 flex flex-grow items-end justify-end gap-1">
            <CustomTooltip content="If you think this is a standard contract, please let us know!">
              <Link
                to={`${routes.contracts.route}/${routes.contracts.children.classes.route}/${data.contractClassId}/${routes.contracts.children.classes.children.id.children.versions.route}/${data.version}/${routes.contracts.children.classes.children.id.children.versions.children.version.children.submitStandardContract.route}`}
              >
                <ExclamationTriangleIcon />
              </Link>
            </CustomTooltip>
            Not available
          </div>
        ),
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
    standardContractType,
  ];
  return valueData;
};
