import { NoirCompiledContract } from "@aztec/aztec.js";
import {
  VerifyInstanceDeploymentPayload,
  verifyInstanceDeploymentPayloadSchema,
} from "../types.js";

export const generateVerifyInstancePayload = ({
  publicKeysString,
  deployer,
  salt,
  constructorArgs,
  artifactObj,
}: {
  publicKeysString: string;
  deployer: string;
  salt: string;
  constructorArgs: string[];
  artifactObj?: { default: NoirCompiledContract } | NoirCompiledContract;
}): VerifyInstanceDeploymentPayload => {
  if (publicKeysString.length !== 514) {
    throw new Error(`Invalid publicKeys length: ${publicKeysString.length}`);
  }
  if (deployer.length !== 66) {
    throw new Error(`Invalid deployer length: ${deployer.length}`);
  }
  if (salt.length !== 66) {
    throw new Error(`Invalid salt length: ${salt.length}`);
  }
  return verifyInstanceDeploymentPayloadSchema.parse({
    publicKeysString,
    deployer,
    salt,
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
