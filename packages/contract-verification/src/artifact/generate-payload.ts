import { NoirCompiledContract } from "@aztec/aztec.js/abi";
import { VerifyArtifactPayload } from "../types.js";

export const generateVerifyArtifactPayload = (
  artifactObj: { default: NoirCompiledContract } | NoirCompiledContract,
): VerifyArtifactPayload => {
  const artifactJson = (artifactObj as { default: NoirCompiledContract })
    .default
    ? (artifactObj as { default: NoirCompiledContract }).default
    : artifactObj;
  const stringifiedArtifactJson = JSON.stringify(artifactJson);
  return {
    stringifiedArtifactJson,
  };
};

export const generateVerifyArtifactUrl = (
  apiBaseUrl: string,
  contractClassId: string,
  version: number,
) => `${apiBaseUrl}/l2/contract-classes/${contractClassId}/versions/${version}`;
