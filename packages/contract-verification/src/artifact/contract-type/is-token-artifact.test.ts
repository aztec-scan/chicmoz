import { NoirCompiledContract } from "@aztec/aztec.js";
import * as someNotStandardTokenContract from "@aztec/noir-contracts.js/artifacts/token_contract-Token" assert { type: "json" };
import standardTokenContract from "@defi-wonderland/aztec-standards/target/token_contract-Token.json" assert { type: "json" };

import { describe, expect, test } from "vitest";
import { isTokenArtifact } from "./is-token-artifact.js";

describe("is token artifact", () => {
  test("should give true for token artifact", () => {
    expect(
      isTokenArtifact(standardTokenContract as unknown as NoirCompiledContract)
        .details,
    ).toBe("");
    expect(
      isTokenArtifact(standardTokenContract as unknown as NoirCompiledContract)
        .result,
    ).toBe(true);
  });
  test("should give false for non-standard token artifact", () => {
    const res = isTokenArtifact(
      someNotStandardTokenContract as unknown as NoirCompiledContract,
    );
    expect(res.details.slice(0,200)).toBe("File map does not match");
    expect(res.result).toBe(false);
  });
});
