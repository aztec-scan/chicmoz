import { loadContractArtifact, FunctionSelector } from "@aztec/stdlib/abi";
import { type NoirCompiledContract } from "@aztec/aztec.js/abi";

/**
 * Builds a mapping of 4-byte function selector hex → function name for all
 * functions in a contract artifact (both private/utility in `artifact.functions`
 * and public non-dispatch functions in `artifact.nonDispatchPublicFunctions`).
 *
 * This is computed once at artifact upload time and stored in the DB as a JSONB
 * column, so the hot path (pending tx ingestion) only needs a simple map lookup.
 *
 * @param artifactJson - Stringified NoirCompiledContract JSON (as stored in DB)
 * @returns A map of { "0x86500181": "transfer", ... } or empty object on failure
 */
export const buildSelectorMap = async (
  artifactJson: string,
): Promise<Record<string, string>> => {
  let noirContract: NoirCompiledContract;
  try {
    noirContract = JSON.parse(artifactJson) as NoirCompiledContract;
  } catch {
    return {};
  }

  try {
    const artifact = loadContractArtifact(noirContract);

    // Combine both function lists:
    // - artifact.functions: private, utility, and the public_dispatch entry
    // - artifact.nonDispatchPublicFunctions: all individual public functions
    const allFunctions = [
      ...artifact.functions,
      ...(artifact.nonDispatchPublicFunctions ?? []),
    ];

    const entries = await Promise.all(
      allFunctions.map(async (fn) => {
        try {
          const selector = await FunctionSelector.fromNameAndParameters(
            fn.name,
            fn.parameters,
          );
          return [selector.toString(), fn.name] as [string, string];
        } catch {
          return null;
        }
      }),
    );

    return Object.fromEntries(
      entries.filter((e): e is [string, string] => e !== null),
    );
  } catch {
    return {};
  }
};

/**
 * Resolves a human-readable function name from a stored Noir compiled contract
 * artifact JSON by matching the 4-byte function selector hex.
 *
 * Prefer using the pre-built selectorMap (from the DB) when available — this
 * function is only needed for the backfill path where the map is being computed
 * for the first time.
 *
 * Searches both `artifact.functions` (private/utility/public_dispatch) and
 * `artifact.nonDispatchPublicFunctions` (all other public functions).
 *
 * @param artifactJson - Stringified NoirCompiledContract JSON (as stored in DB)
 * @param functionSelectorHex - 4-byte selector as a hex string (e.g. "0x86500181")
 * @returns The function name if found, undefined otherwise
 */
export const getFunctionNameFromArtifact = async (
  artifactJson: string,
  functionSelectorHex: string,
): Promise<string | undefined> => {
  const map = await buildSelectorMap(artifactJson);
  return map[functionSelectorHex];
};
