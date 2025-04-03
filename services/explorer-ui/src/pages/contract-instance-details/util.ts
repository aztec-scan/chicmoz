import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { routes } from "~/routes/__root";
import { API_URL, aztecExplorer } from "~/service/constants";

const HARDCODED_DEPLOYER =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const getContractData = (data: ChicmozL2ContractInstanceDeluxe) => {
  const link = `${routes.contracts.route}${routes.contracts.children.classes.route}/${data.contractClassId}/versions/${data.version}`;
  const displayData = [
    {
      label: "ADDRESS",
      value: data.address,
    },
    {
      label: "CLASS ID",
      value: data.contractClassId,
      link,
    },
    {
      label: "BLOCK HASH",
      value: data.blockHash,
      link: `/blocks/${data.blockHash}`,
    },
    { label: "VERSION", value: data.version.toString(), link },
    { label: "DEPLOYER", value: data.deployer },
    {
      label: "RAW DATA",
      value: "View raw data",
      extLink: `${API_URL}/${aztecExplorer.getL2ContractInstance(
        data.address,
      )}`,
    },
  ];
  const isDeployerContract =
    process.env.NODE_ENV === "development" &&
    data.deployer === HARDCODED_DEPLOYER;
  if (isDeployerContract && !data.verifiedDeploymentArguments) {
    displayData.push({
      label: "DEPLOYER CONTRACT 🤖",
      value:
        "This is a contract deployed by the hard-coded deployer. This message will only appear in development mode. But linking to verified contracts for good measure.",
      link: routes.verifiedContractInstances.route,
    });
  }
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
          value: data.verifiedDeploymentArguments.constructorArgs.join(", "),
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
          value: JSON.stringify(
            data.aztecScanNotes.relatedL1ContractAddresses,
            null,
            2,
          ) ?? "None",
        },
      ]
    : undefined;
  return { verifiedDeploymentArguments, deployerMetadata, aztecScanNotes };
};
