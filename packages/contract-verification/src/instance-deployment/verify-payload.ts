import { getDefaultInitializer, loadContractArtifact } from "@aztec/stdlib/abi";
import {
  computeContractAddressFromInstance,
  computeInitializationHash,
  computeSaltedInitializationHash,
} from "@aztec/stdlib/contract";
import { VerifyInstanceDeploymentPayload } from "../types.js";
import { NoirCompiledContract } from "@aztec/aztec.js/abi";
import { Fr } from "@aztec/aztec.js/fields";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { PublicKeys } from "@aztec/aztec.js/keys";

export const verifyInstanceDeploymentPayload = async (
  payload: VerifyInstanceDeploymentPayload & {
    instanceAddress: string;
    stringifiedArtifactJson: string;
    contractClassId: string;
  },
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
    JSON.parse(stringifiedArtifactJson) as unknown as NoirCompiledContract,
  );

  const initFn = getDefaultInitializer(artifact);
  const initializationHash = await computeInitializationHash(
    initFn,
    constructorArgs,
  );
  const saltedHash = await computeSaltedInitializationHash({
    initializationHash,
    salt: Fr.fromString(salt),
    deployer: AztecAddress.fromString(deployer),
  });
  const computedAddress = await computeContractAddressFromInstance({
    originalContractClassId: Fr.fromString(contractClassId),
    saltedInitializationHash: saltedHash,
    publicKeys: PublicKeys.fromString(publicKeysString),
  });
  return computedAddress.toString() === payload.instanceAddress;
};
