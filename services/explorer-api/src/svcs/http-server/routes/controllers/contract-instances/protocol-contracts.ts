import {
  getContractClassFromArtifact,
  ProtocolContractAddress,
} from "@aztec/aztec.js";
import { jsonStringify } from "@aztec/foundation/json-rpc";
import { ProtocolContractSalt } from "@aztec/protocol-contracts";
import { ProtocolContractArtifact } from "@aztec/protocol-contracts/providers/bundle";
import {
  ChicmozL2ContractInstanceDeluxe,
  chicmozL2ContractInstanceDeluxeSchema,
} from "@chicmoz-pkg/types";

const UNKNOWN_FR: `0x${string}` =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const UNKNOWN_FR_POINT =
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const DEFAULTS = {
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

export const initializeProtocolContracts = async () => {
  const authRegistryCC = await getContractClassFromArtifact(
    ProtocolContractArtifact.AuthRegistry,
  );
  const authRegistry: ChicmozL2ContractInstanceDeluxe = {
    address: ProtocolContractAddress.AuthRegistry.toString(),
    contractClassId: authRegistryCC.id.toString(),
    version: authRegistryCC.version,
    artifactJson: jsonStringify(ProtocolContractArtifact.AuthRegistry),
    packedBytecode: authRegistryCC.packedBytecode,
    privateFunctionsRoot: authRegistryCC.privateFunctionsRoot.toString(),
    artifactHash: authRegistryCC.artifactHash.toString(),
    salt: ProtocolContractSalt.AuthRegistry.toString(),
    currentContractClassId: authRegistryCC.id.toString(),
    originalContractClassId: authRegistryCC.id.toString(),
    ...DEFAULTS,
  };
  protocolContracts[ProtocolContractAddress.AuthRegistry.toString()] =
    chicmozL2ContractInstanceDeluxeSchema.parse(authRegistry);

  const contractInstanceDeployerCC = await getContractClassFromArtifact(
    ProtocolContractArtifact.ContractInstanceDeployer,
  );
  const contractInstanceDeployer: ChicmozL2ContractInstanceDeluxe = {
    address: ProtocolContractAddress.ContractInstanceDeployer.toString(),
    contractClassId: contractInstanceDeployerCC.id.toString(),
    version: contractInstanceDeployerCC.version,
    artifactJson: jsonStringify(
      ProtocolContractArtifact.ContractInstanceDeployer,
    ),
    packedBytecode: contractInstanceDeployerCC.packedBytecode,
    privateFunctionsRoot:
      contractInstanceDeployerCC.privateFunctionsRoot.toString(),
    artifactHash: contractInstanceDeployerCC.artifactHash.toString(),
    salt: ProtocolContractSalt.ContractInstanceDeployer.toString(),
    currentContractClassId: contractInstanceDeployerCC.id.toString(),
    originalContractClassId: contractInstanceDeployerCC.id.toString(),
    ...DEFAULTS,
  };

  protocolContracts[
    ProtocolContractAddress.ContractInstanceDeployer.toString()
  ] = contractInstanceDeployer;
  const contractClassRegistererCC = await getContractClassFromArtifact(
    ProtocolContractArtifact.ContractClassRegisterer,
  );
  const contractClassRegisterer: ChicmozL2ContractInstanceDeluxe = {
    address: ProtocolContractAddress.ContractClassRegisterer.toString(),
    contractClassId: contractClassRegistererCC.id.toString(),
    version: contractClassRegistererCC.version,
    artifactJson: jsonStringify(
      ProtocolContractArtifact.ContractClassRegisterer,
    ),
    packedBytecode: contractClassRegistererCC.packedBytecode,
    privateFunctionsRoot:
      contractClassRegistererCC.privateFunctionsRoot.toString(),
    artifactHash: contractClassRegistererCC.artifactHash.toString(),
    salt: ProtocolContractSalt.ContractClassRegisterer.toString(),
    currentContractClassId: contractClassRegistererCC.id.toString(),
    originalContractClassId: contractClassRegistererCC.id.toString(),
    ...DEFAULTS,
  };
  protocolContracts[
    ProtocolContractAddress.ContractClassRegisterer.toString()
  ] = contractClassRegisterer;
  const multiCallEntrypointCC = await getContractClassFromArtifact(
    ProtocolContractArtifact.MultiCallEntrypoint,
  );
  const multiCallEntrypoint: ChicmozL2ContractInstanceDeluxe = {
    address: ProtocolContractAddress.MultiCallEntrypoint.toString(),
    contractClassId: multiCallEntrypointCC.id.toString(),
    version: multiCallEntrypointCC.version,
    artifactJson: jsonStringify(ProtocolContractArtifact.MultiCallEntrypoint),
    packedBytecode: multiCallEntrypointCC.packedBytecode,
    privateFunctionsRoot: multiCallEntrypointCC.privateFunctionsRoot.toString(),
    artifactHash: multiCallEntrypointCC.artifactHash.toString(),
    salt: ProtocolContractSalt.MultiCallEntrypoint.toString(),
    currentContractClassId: multiCallEntrypointCC.id.toString(),
    originalContractClassId: multiCallEntrypointCC.id.toString(),
    ...DEFAULTS,
  };
  protocolContracts[ProtocolContractAddress.MultiCallEntrypoint.toString()] =
    multiCallEntrypoint;
  const feeJuiceCC = await getContractClassFromArtifact(
    ProtocolContractArtifact.FeeJuice,
  );
  const feeJuice: ChicmozL2ContractInstanceDeluxe = {
    address: ProtocolContractAddress.FeeJuice.toString(),
    contractClassId: feeJuiceCC.id.toString(),
    version: feeJuiceCC.version,
    artifactJson: jsonStringify(ProtocolContractArtifact.FeeJuice),
    packedBytecode: feeJuiceCC.packedBytecode,
    privateFunctionsRoot: feeJuiceCC.privateFunctionsRoot.toString(),
    artifactHash: feeJuiceCC.artifactHash.toString(),
    salt: ProtocolContractSalt.FeeJuice.toString(),
    currentContractClassId: feeJuiceCC.id.toString(),
    originalContractClassId: feeJuiceCC.id.toString(),
    ...DEFAULTS,
  };
  protocolContracts[ProtocolContractAddress.FeeJuice.toString()] = feeJuice;
  const routerCC = await getContractClassFromArtifact(
    ProtocolContractArtifact.Router,
  );
  const router: ChicmozL2ContractInstanceDeluxe = {
    address: ProtocolContractAddress.Router.toString(),
    contractClassId: routerCC.id.toString(),
    version: routerCC.version,
    artifactJson: jsonStringify(ProtocolContractArtifact.Router),
    packedBytecode: routerCC.packedBytecode,
    privateFunctionsRoot: routerCC.privateFunctionsRoot.toString(),
    artifactHash: routerCC.artifactHash.toString(),
    salt: ProtocolContractSalt.Router.toString(),
    currentContractClassId: routerCC.id.toString(),
    originalContractClassId: routerCC.id.toString(),
    ...DEFAULTS,
  };
  protocolContracts[ProtocolContractAddress.Router.toString()] = router;
};

const protocolContracts: Record<string, ChicmozL2ContractInstanceDeluxe> = {};

export const getProtocolContract = (
  address: string,
): ChicmozL2ContractInstanceDeluxe | undefined => {
  return protocolContracts[address];
};
