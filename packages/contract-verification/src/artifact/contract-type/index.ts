import { NoirCompiledContract } from "@aztec/aztec.js";
import { ContractType } from "@chicmoz-pkg/types";
import { isTokenArtifact } from "./is-token-artifact.js";
import { isTokenBridgeArtifact } from "./is-token-bridge-artifact.js";

export const getContractType = (
  contract: NoirCompiledContract,
): {
  contractType: ContractType;
  artifactContractName: string;
} => {
  // Check if it's a token
  const isToken = isTokenArtifact(contract);
  if (isToken.result) {
    return {
      contractType: ContractType.Token,
      artifactContractName: isToken.contractName,
    };
  }
  // eslint-disable-next-line no-console
  console.log("isToken", isToken.details);

  // Check if it's a token bridge
  const isTokenBridge = isTokenBridgeArtifact(contract);
  if (isTokenBridge.result) {
    return {
      contractType: ContractType.TokenBridge,
      artifactContractName: isTokenBridge.contractName,
    };
  }
  // eslint-disable-next-line no-console
  console.log("isTokenBridge", isTokenBridge.details);
  return {
    contractType: ContractType.Unknown,
    artifactContractName: "", // TODO: might be able to get name anyway?
  };
};
