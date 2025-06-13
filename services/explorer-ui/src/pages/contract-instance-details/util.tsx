import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { CustomTooltip } from "~/components/custom-tooltip";
import { type DetailItem } from "~/components/info-display/key-value-display";
import { routes } from "~/routes/__root";
import { API_URL, aztecExplorer } from "~/service/constants";

export const getContractData = ({
  data,
  isProtocolContract,
}: {
  data: ChicmozL2ContractInstanceDeluxe;
  isProtocolContract?: boolean;
}) => {
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
  const ccLink = `${routes.contracts.route}${routes.contracts.children.classes.route}/${data.contractClassId}/versions/${data.version}`;
  let displayData: DetailItem[] = [
    {
      label: "ADDRESS",
      value: data.address,
    },
    {
      label: "CLASS ID",
      value: data.contractClassId,
      link: isProtocolContract ? undefined : ccLink,
    },
    {
      label: "VERSION",
      value: data.version.toString(),
      link: isProtocolContract ? undefined : ccLink,
    },
  ];
  if (!isProtocolContract) {
    displayData = displayData.concat([
      {
        label: "BLOCK HASH",
        value: data.blockHash,
        link: `/blocks/${data.blockHash}`,
      },
      { label: "DEPLOYER", value: data.deployer },
      standardContractType,
    ]);
  } else {
    displayData.push({
      label: "PROTOCOL CONTRACT 🤖",
      value:
        "This is a contract provided by the protocol and used with a hardcoded address",
    });
  }
  displayData.push({
    label: "RAW DATA",
    value: "View raw data",
    extLink: `${API_URL}${aztecExplorer.getL2ContractInstance(data.address)}`,
  });
  return displayData;
};

export const getVerifiedContractInstanceData = (
  data: ChicmozL2ContractInstanceDeluxe,
) => {
  return data.deployerMetadata
    ? [
        {
          label: "CONTRACT IDENTIFIER",
          value: data.deployerMetadata.contractIdentifier,
        },
        {
          label: "DETAILS",
          value: data.deployerMetadata.details.slice(0, 50) + "...",
        },
        {
          label: "CREATOR NAME",
          value: data.deployerMetadata.creatorName,
        },
        {
          label: "CREATOR CONTACT",
          value: data.deployerMetadata.creatorContact,
        },
        {
          label: "APP URL",
          value: data.deployerMetadata.appUrl,
          extLink: data.deployerMetadata.appUrl,
        },
        {
          label: "REPO URL",
          value: data.deployerMetadata.repoUrl,
          extLink: data.deployerMetadata.repoUrl,
        },
      ]
    : undefined;
};

export const getVerifiedContractInstanceDeploymentData = (
  data: ChicmozL2ContractInstanceDeluxe,
) => {
  const verifiedDeploymentArguments = data.verifiedDeploymentArguments
    ? [
        {
          label: "ADDRESS",
          value: data.verifiedDeploymentArguments.address,
        },
        {
          label: "SALT",
          value: data.verifiedDeploymentArguments.salt,
        },
        {
          label: "DEPLOYER",
          value: data.verifiedDeploymentArguments.deployer,
        },
        {
          label: "PUBLIC KEYS STRING",
          value: data.verifiedDeploymentArguments.publicKeysString,
        },
        {
          label: "CONSTRUCTOR ARGS",
          value:
            data.verifiedDeploymentArguments.constructorArgs.join(", ") ?? "[]",
        },
      ]
    : undefined;
  const deployerMetadata = data.deployerMetadata
    ? [
        {
          label: "CONTRACT IDENTIFIER",
          value: data.deployerMetadata.contractIdentifier,
        },
        {
          label: "DETAILS",
          value: data.deployerMetadata.details,
        },
        {
          label: "CREATOR NAME",
          value: data.deployerMetadata.creatorName,
        },
        {
          label: "CREATOR CONTACT",
          value: data.deployerMetadata.creatorContact,
        },
        {
          label: "APP URL",
          value: data.deployerMetadata.appUrl,
          extLink: data.deployerMetadata.appUrl,
        },
        {
          label: "REPO URL",
          value: data.deployerMetadata.repoUrl,
          extLink: data.deployerMetadata.repoUrl,
        },
      ]
    : undefined;
  const aztecScanNotes = data.aztecScanNotes
    ? [
        {
          label: "ORIGIN",
          value: data.aztecScanNotes.origin,
        },
        {
          label: "COMMENT",
          value: data.aztecScanNotes.comment,
        },
        {
          label: "RELATED L1 CONTRACT ADDRESSES",
          value:
            JSON.stringify(
              data.aztecScanNotes.relatedL1ContractAddresses,
              null,
              2,
            ) ?? "None",
        },
      ]
    : undefined;
  return { verifiedDeploymentArguments, deployerMetadata, aztecScanNotes };
};
