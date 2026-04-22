import { loadContractArtifact , getFunctionArtifact , FunctionSelector } from "@aztec/stdlib/abi";
import { type NoirCompiledContract } from "@aztec/aztec.js/abi";

/**
 * Resolves a human-readable function name from a stored Noir compiled contract
 * artifact JSON by matching the 4-byte function selector hex.
 *
 * @param artifactJson - Stringified NoirCompiledContract JSON (as stored in DB)
 * @param functionSelectorHex - 4-byte selector as a hex string (output of FunctionSelector.toString())
 * @returns The function name if found, undefined otherwise
 */
export const getFunctionNameFromArtifact = async (
  artifactJson: string,
  functionSelectorHex: string,
): Promise<string | undefined> => {
  let noirContract: NoirCompiledContract;
  try {
    noirContract = JSON.parse(artifactJson) as NoirCompiledContract;
  } catch {
    return undefined;
  }

  try {
    const artifact = loadContractArtifact(noirContract);
    const selector = FunctionSelector.fromString(functionSelectorHex);
    const fn = await getFunctionArtifact(artifact, selector);
    return fn.name;
  } catch {
    // Selector not found in this artifact or artifact is malformed
    return undefined;
  }
};
