/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NoirCompiledContract } from "@aztec/aztec.js";
import TokenContractArtifactJson from "@defi-wonderland/aztec-standards/target/token_contract-Token.json" assert { type: "json" };
import assert from "assert";
import { ContractTypeParsingResult } from "../../types.js";

export const isTokenArtifact = (
  artifact: NoirCompiledContract,
): ContractTypeParsingResult => {
  let details = "";
  let contractName = "";
  try {
    if (!artifact.name) {
      throw new Error("Artifact name is missing");
    }
    contractName = artifact.name;
    assert.deepStrictEqual(
      artifact.file_map,
      TokenContractArtifactJson.file_map,
      "File map does not match",
    );
    assert.deepStrictEqual(
      artifact.functions,
      TokenContractArtifactJson.functions,
    );
    assert.deepStrictEqual(
      artifact.name,
      TokenContractArtifactJson.name,
    );
    assert.deepStrictEqual(
      artifact.outputs,
      TokenContractArtifactJson.outputs,
      "Outputs do not match",
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    details = (err as Error).message;
  }
  return {
    result: details === "",
    contractName,
    details,
  };
};
