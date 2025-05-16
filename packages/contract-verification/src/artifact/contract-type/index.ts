import { NoirCompiledContract } from "@aztec/aztec.js";
import { ContractType } from "@chicmoz-pkg/types";
import { isTokenArtifact } from "./is-token-artifact.js";

export const getContractType = (
  contract: NoirCompiledContract,
): {
  contractType: ContractType;
  artifactContractName: string;
} => {
  const isToken = isTokenArtifact(contract);
  const artifactContractName = isToken.contractName ?? "";
  if (isToken.result) {
    return {
      contractType: ContractType.Token,
      artifactContractName: isToken.contractName,
    };
  }
  // eslint-disable-next-line no-console
  console.log("isToken", isToken.details);

  return {
    contractType: ContractType.Unknown,
    artifactContractName,
  };
};
