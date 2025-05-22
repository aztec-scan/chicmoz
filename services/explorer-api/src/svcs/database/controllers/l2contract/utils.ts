import {
  AztecScanNote,
  ChicmozL2ContractClassRegisteredEvent,
  ChicmozL2ContractInstanceDeluxe,
  ChicmozL2ContractInstanceDeployedEvent,
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
  isOrphaned,
}: {
  contractClass: ChicmozL2ContractClassRegisteredEvent;
  instance: Omit<ChicmozL2ContractInstanceDeployedEvent, "publicKeys"> & {
    masterNullifierPublicKey: string;
    masterIncomingViewingPublicKey: string;
    masterOutgoingViewingPublicKey: string;
    masterTaggingPublicKey: string;
  };
  deployerMetadata:
    | (Omit<
        ChicmozL2ContractInstanceDeluxe["deployerMetadata"],
        "reviewedAt"
      > & {
        reviewedAt: Date | null;
      })
    | null;
  verifiedDeploymentArguments:
    | (Omit<
        ChicmozL2ContractInstanceDeluxe["verifiedDeploymentArguments"],
        "constructorArgs"
      > & {
        constructorArgs: unknown;
      })
    | null;
  aztecScanNotes:
    | (Omit<AztecScanNote, "relatedL1ContractAddresses"> & {
        relatedL1ContractAddresses: unknown;
      })
    | null;
  isOrphaned: boolean;
}): ChicmozL2ContractInstanceDeluxe => {
  const objToParse: ChicmozL2ContractInstanceDeluxe = {
    ...contractClass,
    currentContractClassId: instance.currentContractClassId,
    originalContractClassId: instance.originalContractClassId,
    deployerMetadata:
      (deployerMetadata as ChicmozL2ContractInstanceDeluxe["deployerMetadata"]) ??
      undefined,
    verifiedDeploymentArguments:
      (verifiedDeploymentArguments as ChicmozL2ContractInstanceDeluxe["verifiedDeploymentArguments"]) ??
      undefined,
    aztecScanNotes:
      (aztecScanNotes as ChicmozL2ContractInstanceDeluxe["aztecScanNotes"]) ??
      undefined,
    blockHash: instance.blockHash,
    // Ensure we have a Buffer as required by the schema
    packedBytecode: Buffer.isBuffer(contractClass.packedBytecode)
      ? contractClass.packedBytecode 
      : Buffer.from(
          ArrayBuffer.isView(contractClass.packedBytecode)
            ? contractClass.packedBytecode 
            : typeof contractClass.packedBytecode === 'string'
              ? contractClass.packedBytecode
              : JSON.stringify(contractClass.packedBytecode)
        ),
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
    isOrphaned,
  };
  return chicmozL2ContractInstanceDeluxeSchema.parse(objToParse);
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
