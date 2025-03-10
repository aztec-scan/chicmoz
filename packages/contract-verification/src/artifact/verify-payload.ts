import {
  NoirCompiledContract,
  getContractClassFromArtifact,
  loadContractArtifact,
} from "@aztec/aztec.js";
import { ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { VerifyArtifactPayload } from "../types.js";

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
  const isMatchingByteCode = storedArtifact.packedBytecode.equals(
    contractClass.packedBytecode,
  );
  return {
    isMatchingByteCode,
    artifactContractName: parsedArtifact.name ?? "PARSE ERROR",
  };
};
