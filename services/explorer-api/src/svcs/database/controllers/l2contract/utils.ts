/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ChicmozL2ContractInstanceDeluxe,
  chicmozL2ContractInstanceDeluxeSchema,
} from "@chicmoz-pkg/types";
import { getTableColumns } from "drizzle-orm";
import { l2ContractClassRegistered } from "../../schema/index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseDeluxe = ({
  contractClass,
  instance,
  deployerMetadata,
  verifiedDeploymentArguments,
  aztecScanNotes,
}: {
  contractClass: any;
  instance: any;
  deployerMetadata?: any;
  verifiedDeploymentArguments?: any;
  aztecScanNotes?: any;
}): ChicmozL2ContractInstanceDeluxe => {
  return chicmozL2ContractInstanceDeluxeSchema.parse({
    ...contractClass,
    currentContractClassId: instance.currentContractClassId,
    originalContractClassId: instance.originalContractClassId,
    deployerMetadata: deployerMetadata ?? undefined,
    verifiedDeploymentArguments: verifiedDeploymentArguments ?? undefined,
    aztecScanNotes: aztecScanNotes ?? undefined,
    blockHash: instance.blockHash,
    packedBytecode: Buffer.from(contractClass.packedBytecode),
    address: instance.address,
    version: instance.version,
    salt: instance.salt,
    initializationHash: instance.initializationHash,
    deployer: instance.deployer,
    publicKeys: {
      masterNullifierPublicKey: instance.masterNullifierPublicKey,
      masterIncomingViewingPublicKey: instance.masterIncomingViewingPublicKey,
      masterOutgoingViewingPublicKey: instance.masterOutgoingViewingPublicKey,
      masterTaggingPublicKey: instance.masterTaggingPublicKey,
    },
  });
};

export const getContractClassRegisteredColumns = (
  includeArtifactJson?: boolean,
) => {
  const { artifactJson, ...columns } = getTableColumns(
    l2ContractClassRegistered,
  );
  return {
    ...columns,
    ...(includeArtifactJson ? { artifactJson } : {}),
  };
};
