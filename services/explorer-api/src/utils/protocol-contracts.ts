import { ContractArtifact } from "@aztec/aztec.js/abi";
import { jsonStringify } from "@aztec/foundation/json-rpc";
import {
  ProtocolContractAddress,
  ProtocolContractName,
  ProtocolContractSalt,
} from "@aztec/protocol-contracts";
import { ProtocolContractArtifact } from "@aztec/protocol-contracts/providers/bundle";
import { getContractClassFromArtifact } from "@aztec/stdlib/contract";
import {
  ChicmozL2ContractClassRegisteredEvent,
  ChicmozL2ContractInstanceDeluxe,
} from "@chicmoz-pkg/types";

const UNKNOWN_FR: `0x${string}` =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const UNKNOWN_FR_POINT =
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const CONTRACT_INSTANCE_DELUXE_DEFAULTS = {
  blockHeight: 0 as unknown as bigint,
  blockHash: UNKNOWN_FR,
  initializationHash: UNKNOWN_FR,
  deployer: UNKNOWN_FR,
  publicKeys: {
    masterNullifierPublicKey: UNKNOWN_FR_POINT,
    masterIncomingViewingPublicKey: UNKNOWN_FR_POINT,
    masterOutgoingViewingPublicKey: UNKNOWN_FR_POINT,
    masterTaggingPublicKey: UNKNOWN_FR_POINT,
  },
  isOrphaned: false,
};

const getCIandCC = async ({
  contractArtifact,
  address,
  salt,
}: {
  contractArtifact: ContractArtifact;
  address: string;
  salt: string;
}): Promise<{
  contractInstance: ChicmozL2ContractInstanceDeluxe;
  contractClassRegistered: ChicmozL2ContractClassRegisteredEvent;
}> => {
  const contractClass = await getContractClassFromArtifact(contractArtifact);
  const contractInstance: ChicmozL2ContractInstanceDeluxe = {
    address,
    contractClassId: contractClass.id.toString(),
    version: contractClass.version,
    artifactJson: jsonStringify(contractArtifact),
    packedBytecode: contractClass.packedBytecode,
    privateFunctionsRoot: contractClass.privateFunctionsRoot.toString(),
    artifactHash: contractClass.artifactHash.toString(),
    salt,
    currentContractClassId: contractClass.id.toString(),
    originalContractClassId: contractClass.id.toString(),
    ...CONTRACT_INSTANCE_DELUXE_DEFAULTS,
  };
  const contractClassRegistered: ChicmozL2ContractClassRegisteredEvent = {
    contractClassId: contractInstance.contractClassId,
    blockHash: UNKNOWN_FR,
    version: contractInstance.version,
    artifactHash: contractInstance.artifactHash,
    privateFunctionsRoot: contractInstance.privateFunctionsRoot,
    packedBytecode: contractInstance.packedBytecode,
    artifactJson: contractInstance.artifactJson,
    artifactContractName: contractArtifact.name,
  };
  return { contractInstance, contractClassRegistered };
};

export const initializeProtocolContracts = async () => {
  for (const [name, artifact] of Object.entries(ProtocolContractArtifact) as [
    ProtocolContractName,
    ContractArtifact,
  ][]) {
    const { contractInstance, contractClassRegistered } = await getCIandCC({
      contractArtifact: artifact,
      address: ProtocolContractAddress[name].toString(),
      salt: ProtocolContractSalt[name].toString(),
    });
    protocolContractInstances[contractInstance.address] = contractInstance;
    protocolContractClasses[contractClassRegistered.contractClassId] = {
      ...contractClassRegistered,
      blockHash: UNKNOWN_FR,
    };
    if (contractInstance.artifactJson) {
      protocolArtifactsByHash[contractInstance.artifactHash] = artifact;
    }
  }
};

const protocolContractInstances: Record<
  string,
  ChicmozL2ContractInstanceDeluxe
> = {};
const protocolContractClasses: Record<
  string,
  ChicmozL2ContractClassRegisteredEvent
> = {};
const protocolArtifactsByHash: Record<string, object> = {};

export const getProtocolContractInstance = (
  address: string,
): ChicmozL2ContractInstanceDeluxe | undefined =>
  protocolContractInstances[address];

export const getProtocolContractByClassId = (
  classId: string,
): ChicmozL2ContractClassRegisteredEvent | undefined =>
  protocolContractClasses[classId];

export const getProtocolContractArtifactByHash = (
  artifactHash: string,
): object | undefined => protocolArtifactsByHash[artifactHash];
