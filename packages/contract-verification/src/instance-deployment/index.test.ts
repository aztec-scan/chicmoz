import {
  NoirCompiledContract,
  getContractClassFromArtifact,
  loadContractArtifact,
} from "@aztec/aztec.js";
import contractArtifactJson from "@aztec/noir-contracts.js/artifacts/easy_private_voting_contract-EasyPrivateVoting" with { type: "json" };
import { beforeAll, describe, expect, test } from "vitest";
import { VerifyInstanceDeploymentPayload } from "../types.js";
import { generateVerifyInstancePayload } from "./generate-payload.js";
import { verifyInstanceDeploymentPayload } from "./verify-payload.js";

const salt =
  "0x22a286727cc52b2af208b884a01858793d29d20e897df4b2a80237d96528c8de";
const adminAddress =
  "0x2e16425c902f899df2b77bacc911e75e9acb5f0d4e3866303e372b2ed44545d9";
const publicKeyValues =
  "0x01498945581e0eb9f8427ad6021184c700ef091d570892c437d12c7d90364bbd170ae506787c5c43d6ca9255d571c10fa9ffa9d141666e290c347c5c9ab7e34400c044b05b6ca83b9c2dbae79cc1135155956a64e136819136e9947fe5e5866c1c1f0ca244c7cd46b682552bff8ae77dea40b966a71de076ec3b7678f2bdb1511b00316144359e9a3ec8e49c1cdb7eeb0cedd190dfd9dc90eea5115aa779e287080ffc74d7a8b0bccb88ac11f45874172f3847eb8b92654aaa58a3d2b8dc7833019c111f36ad3fc1d9b7a7a14344314d2864b94f030594cd67f753ef774a1efb2039907fe37f08d10739255141bb066c506a12f7d1e8dfec21abc58494705b6f";
const instanceAddress =
  "0x02a8a8fd9e12fb24265a20109f42fa1afd51d7a1bc88dd163673e91ba38698c0";

describe("verify instance deployment", () => {
  let payload: VerifyInstanceDeploymentPayload;
  let generatingPayloadError: Error;
  let verifyInstanceDeploymentPayloadResult: boolean;
  let verifyInstanceDeploymentPayloadError: Error;
  let contractClass;
  beforeAll(async () => {
    const loadedArtifact = loadContractArtifact(contractArtifactJson);
    contractClass = await getContractClassFromArtifact(loadedArtifact);
    try {
      payload = generateVerifyInstancePayload({
        publicKeysString: publicKeyValues,
        deployer: adminAddress,
        salt,
        constructorArgs: [adminAddress],
        artifactObj: contractArtifactJson,
      });
    } catch (error) {
      generatingPayloadError = error as Error;
    }

    try {
      verifyInstanceDeploymentPayloadResult =
        await verifyInstanceDeploymentPayload({
          ...payload,
          stringifiedArtifactJson: JSON.stringify(
            contractArtifactJson as unknown as NoirCompiledContract,
          ),
          instanceAddress,
          contractClassId: contractClass.id.toString(),
        });
    } catch (error) {
      verifyInstanceDeploymentPayloadError = error as Error;
    }
  });
  test("generate payload without error", () => {
    expect(generatingPayloadError).toBeUndefined();
  });
  test("verify payload without error", () => {
    expect(verifyInstanceDeploymentPayloadError).toBeUndefined();
  });
  test("verify payload result", () => {
    expect(verifyInstanceDeploymentPayloadResult).toBe(true);
  });
});
