import { NoirCompiledContract } from "@aztec/aztec.js";
import votingContractArtifactJson from "@aztec/noir-contracts.js/artifacts/easy_private_voting_contract-EasyPrivateVoting" with { type: "json" };
import * as someTokenContract from "@aztec/noir-contracts.js/artifacts/token_contract-Token" with { type: "json" };
import { describe, expect, test } from "vitest";
import { isTokenArtifact } from "./is-token-artifact.js";

describe("is token artifact", () => {
  test("should give true for token artifact", () => {
    expect(
      isTokenArtifact(someTokenContract as unknown as NoirCompiledContract)
        .details
    ).toBe("");
    expect(
      isTokenArtifact(someTokenContract as unknown as NoirCompiledContract)
        .result
    ).toBe(true);
  });
  test("should give false for non-token artifact", () => {
    const res = isTokenArtifact(votingContractArtifactJson);
    expect(res.result).toBe(false);
    expect(res.details).toBe(
      '{"code":"custom","message":"Missing functions: transfer_to_private, transfer_to_public, transfer_in_private, transfer_in_public","path":["functions"]}'
    );
  });
});
