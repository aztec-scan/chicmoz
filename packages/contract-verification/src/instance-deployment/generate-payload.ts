import { NoirCompiledContract } from "@aztec/aztec.js/abi";
import {
  VerifyInstanceDeploymentPayload,
  verifyInstanceDeploymentPayloadSchema,
} from "../types.js";

export const generateVerifyInstancePayload = ({
  publicKeysString,
  deployer,
  salt,
  immutablesHash,
  constructorArgs,
  artifactObj,
}: {
  publicKeysString: string;
  deployer: string;
  salt: string;
  immutablesHash?: string;
  constructorArgs: string[];
  artifactObj?: { default: NoirCompiledContract } | NoirCompiledContract;
}): VerifyInstanceDeploymentPayload => {
  if (![450, 514].includes(publicKeysString.length)) {
    throw new Error(`Invalid publicKeys length: ${publicKeysString.length}`);
  }
  if (deployer.length !== 66) {
    throw new Error(`Invalid deployer length: ${deployer.length}`);
  }
  if (salt.length !== 66) {
    throw new Error(`Invalid salt length: ${salt.length}`);
  }
  if (immutablesHash && immutablesHash.length !== 66) {
    throw new Error(`Invalid immutablesHash length: ${immutablesHash.length}`);
  }
  return verifyInstanceDeploymentPayloadSchema.parse({
    publicKeysString,
    deployer,
    salt,
    immutablesHash,
    constructorArgs,
    stringifiedArtifactJson: artifactObj
      ? JSON.stringify(
          (artifactObj as { default: NoirCompiledContract }).default
            ? (artifactObj as { default: NoirCompiledContract }).default
            : artifactObj,
        )
      : undefined,
  });
};

export const generateVerifyInstanceUrl = (
  apiBaseUrl: string,
  address: string,
) => `${apiBaseUrl}/l2/contract-instances/${address}`;
