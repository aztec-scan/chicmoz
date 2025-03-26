import { NoirCompiledContract } from "@aztec/aztec.js";
import * as votingContractArtifactJson from "@aztec/noir-contracts.js/artifacts/easy_private_voting_contract-EasyPrivateVoting" assert { type: "json" };
import * as someBridgeContract from "@aztec/noir-contracts.js/artifacts/token_bridge_contract-TokenBridge" assert { type: "json" };
import { describe, expect, test } from "vitest";
import { isTokenBridgeArtifact } from "./is-token-bridge-artifact.js";

describe("isTokenBridgeArtifact", () => {
  test("should give true for token bridge artifact", () => {
    expect(
      isTokenBridgeArtifact(
        someBridgeContract as unknown as NoirCompiledContract,
      ).details,
    ).toBe("");
    expect(
      isTokenBridgeArtifact(
        someBridgeContract as unknown as NoirCompiledContract,
      ).result,
    ).toBe(true);
  });
  test("should give false for non-token bridge artifact", () => {
    const res = isTokenBridgeArtifact(votingContractArtifactJson);
    expect(res.result).toBe(false);
    expect(res.details).toBe(
      '{"code":"custom","message":"Missing functions: get_config, exit_to_l1_public, get_config_public, claim_public, claim_private, exit_to_l1_private","path":["functions"]}',
    );
  });
});
