import { NoirCompiledContract, loadContractArtifact } from "@aztec/aztec.js";
import {
  AztecAddress,
  Fr,
  PublicKeys,
  computeContractAddressFromInstance,
  computeInitializationHash,
  computeSaltedInitializationHash,
} from "@aztec/circuits.js";
import { VerifyInstanceDeploymentPayload } from "types.js";

export const verifyInstanceDeploymentPayload = async (
  payload: VerifyInstanceDeploymentPayload & {
    instanceAddress: string;
    stringifiedArtifactJson: string;
    contractClassId: string;
  }
): Promise<boolean> => {
  const {
    stringifiedArtifactJson,
    contractClassId,
    constructorArgs,
    deployer,
    salt,
    publicKeysString,
  } = payload;
  const artifact = loadContractArtifact(
    JSON.parse(stringifiedArtifactJson) as unknown as NoirCompiledContract
  );

  const initFn = artifact.functions.find((fn) => fn.name === "constructor");
  const initializationHash = await computeInitializationHash(
    initFn,
    constructorArgs
  );
  const saltedHash = await computeSaltedInitializationHash({
    initializationHash,
    salt: Fr.fromString(salt),
    deployer: AztecAddress.fromString(deployer),
  });
  const computedAddress = await computeContractAddressFromInstance({
    contractClassId: Fr.fromString(contractClassId),
    saltedInitializationHash: saltedHash,
    publicKeys: PublicKeys.fromString(publicKeysString),
  });
  return computedAddress === AztecAddress.fromString(payload.instanceAddress);
};
