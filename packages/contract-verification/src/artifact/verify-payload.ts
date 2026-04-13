import { ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { VerifyArtifactPayload } from "../types.js";
import {
  loadContractArtifact,
  NoirCompiledContract,
} from "@aztec/aztec.js/abi";
import { getContractClassFromArtifact } from "@aztec/aztec.js/contracts";

export type VerificationResult = {
  isMatchingByteCode: boolean;
  artifactContractName: string;
};

export const verifyArtifactPayload = async (
  artifactPayload: VerifyArtifactPayload,
  storedArtifact: ChicmozL2ContractClassRegisteredEvent,
): Promise<VerificationResult> => {
  const parsedArtifact = JSON.parse(
    artifactPayload.stringifiedArtifactJson,
  ) as NoirCompiledContract;
  const loadedArtifact = loadContractArtifact(parsedArtifact);
  const contractClass = await getContractClassFromArtifact(loadedArtifact);
  const storedBytes = Uint8Array.from(storedArtifact.packedBytecode);
  const contractBytes = Uint8Array.from(contractClass.packedBytecode);
  const isMatchingByteCode =
    storedBytes.length === contractBytes.length &&
    storedBytes.every((value, index) => value === contractBytes[index]);
  return {
    isMatchingByteCode,
    artifactContractName: parsedArtifact.name ?? "PARSE ERROR",
  };
};
