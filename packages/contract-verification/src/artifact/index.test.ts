import { NoirCompiledContract } from "@aztec/aztec.js";
import * as votingContractArtifactJson from "@aztec/noir-contracts.js/artifacts/easy_private_voting_contract-EasyPrivateVoting" assert { type: "json" };
import { ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { VerifyArtifactPayload } from "types.js";
import { beforeAll, describe, expect, test } from "vitest";
import {
  VerificationResult,
  generateVerifyArtifactPayload,
  verifyArtifactPayload,
} from "./index.js";

const matchingArtifact = votingContractArtifactJson;

describe("artifact verification", () => {
  let payload: VerifyArtifactPayload;
  let error: Error;
  let verificationResult: VerificationResult;
  let invalidVerificationResult: VerificationResult;
  let verificationError: Error;
  beforeAll(async () => {
    try {
      payload = generateVerifyArtifactPayload(votingContractArtifactJson);
    } catch (e) {
      error = e as Error;
    }
    try {
      verificationResult = await verifyArtifactPayload(payload, {
        packedBytecode: packedBytecode,
      } as ChicmozL2ContractClassRegisteredEvent);
    } catch (e) {
      verificationError = e as Error;
    }
    try {
      invalidVerificationResult = await verifyArtifactPayload(payload, {
        packedBytecode: unMatchingPackedBytecode,
      } as ChicmozL2ContractClassRegisteredEvent);
    } catch (e) {
      verificationError = e as Error;
    }
  });
  describe("generate payload", () => {
    test("create payload without errors", () => {
      expect(error, "error").toBeUndefined();
    });
    test("create correct payload", () => {
      const parsed = JSON.parse(
        payload.stringifiedArtifactJson
      ) as NoirCompiledContract;
      expect(payload, "payload").toBeDefined();
      expect(parsed.name, "artifact name").toEqual(matchingArtifact.name);
      expect(parsed.functions, "artifact functions").toEqual(
        matchingArtifact.functions
      );
      expect(parsed.file_map, "artifact file map").toEqual(
        matchingArtifact.file_map
      );
      expect(parsed.outputs, "artifact outputs").toEqual(
        matchingArtifact.outputs
      );
    });
  });
  describe("verify payload", () => {
    test("should verify matching payload wihout errors", () => {
      expect(verificationError, "verification error").toBeUndefined();
    });
    test("should verify matching payload", () => {
      expect(verificationResult.isMatchingByteCode, "verification result").toBe(
        true
      );
    });
    test("should not verify non-matching payload", () => {
      // TODO: make the DB actually have a valid byte code and instead try verify with a valid *but incorrect* byte code
      expect(
        invalidVerificationResult.isMatchingByteCode,
        "verification result"
      ).toBe(false);
    });
  });
});

const unMatchingPackedBytecode = Buffer.from([0]);

// INFO: This bytecode is of the contract aritfact of the Voting contract
const packedBytecode = Buffer.from(
  [39, 0, 2, 4, 1, 40, 0, 0, 1, 4, 128, 79, 39, 0, 0, 4, 3, 39, 2, 2, 4, 1, 39, 2, 3, 4, 0, 31, 24, 0, 3, 0, 2, 128, 78, 46, 8, 128, 78, 0, 1, 37, 0, 0, 0, 69, 37, 0, 0, 0, 161, 40, 2, 0, 1, 4, 128, 79, 39, 2, 2, 4, 0, 59, 13, 0, 1, 0, 2, 40, 0, 128, 67, 4, 0, 3, 40, 0, 128, 68, 1, 0, 0, 40, 0, 128, 69, 4, 0, 0, 40, 0, 128, 70, 0, 0, 0, 40, 0, 128, 71, 1, 0, 1, 40, 0, 128, 72, 4, 0, 1, 40, 0, 128, 73, 0, 0, 1, 40, 0, 128, 74, 4, 0, 2, 40, 0, 128, 75, 0, 0, 3, 40, 0, 128, 76, 0, 0, 13, 43, 0, 128, 77, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 38, 37, 0, 0, 11, 13, 41, 2, 0, 2, 0, 53, 57, 61, 243, 10, 56, 1, 2, 3, 39, 2, 4, 4, 0, 39, 2, 6, 4, 3, 0, 56, 4, 6, 5, 45, 8, 1, 2, 0, 16, 1, 5, 1, 39, 3, 2, 4, 1, 0, 40, 2, 2, 5, 45, 14, 4, 5, 0, 40, 5, 2, 5, 45, 14, 4, 5, 39, 2, 5, 4, 3, 0, 56, 2, 5, 4, 39, 2, 4, 0, 44, 36, 2, 0, 3, 0, 0, 0, 255, 35, 0, 0, 6, 15, 45, 8, 1, 5, 39, 2, 6, 4, 2, 0, 16, 1, 6, 1, 39, 3, 5, 4, 1, 0, 40, 5, 2, 6, 31, 36, 128, 72, 128, 72, 0, 6, 45, 13, 5, 6, 0, 40, 6, 2, 6, 45, 14, 6, 5, 45, 8, 1, 6, 0, 0, 1, 2, 1, 45, 14, 5, 6, 45, 8, 1, 5, 0, 0, 1, 2, 1, 46, 10, 128, 69, 0, 5, 39, 2, 8, 4, 9, 45, 8, 0, 9, 45, 12, 6, 10, 45, 12, 5, 11, 0, 16, 0, 8, 0, 37, 0, 0, 11, 54, 45, 4, 0, 0, 45, 12, 10, 7, 1, 40, 0, 7, 128, 72, 0, 6, 45, 13, 6, 5, 45, 8, 1, 6, 0, 0, 1, 2, 1, 46, 10, 128, 68, 0, 6, 45, 8, 1, 6, 0, 0, 1, 2, 1, 46, 10, 128, 70, 0, 6, 45, 8, 1, 6, 0, 0, 1, 2, 1, 39, 2, 7, 0, 72, 45, 14, 7, 6, 30, 2, 0, 6, 0, 54, 56, 0, 6, 0, 7, 0, 8, 0, 28, 12, 8, 9, 0, 4, 56, 9, 7, 10, 36, 2, 0, 8, 0, 0, 1, 208, 39, 2, 7, 4, 0, 60, 9, 1, 7, 54, 56, 0, 6, 0, 7, 0, 8, 2, 28, 12, 8, 6, 0, 4, 56, 6, 7, 9, 36, 2, 0, 8, 0, 0, 1, 244, 39, 2, 6, 4, 0, 60, 9, 1, 6, 45, 8, 1, 6, 39, 2, 7, 4, 2, 0, 16, 1, 7, 1, 39, 3, 6, 4, 1, 0, 40, 6, 2, 7, 31, 36, 128, 69, 128, 72, 0, 7, 1, 40, 0, 6, 128, 72, 0, 8, 45, 13, 8, 7, 28, 12, 7, 8, 4, 28, 12, 8, 6, 0, 45, 8, 1, 7, 39, 2, 8, 4, 2, 0, 16, 1, 8, 1, 39, 3, 7, 4, 1, 0, 40, 7, 2, 8, 31, 36, 128, 72, 128, 72, 0, 8, 45, 13, 7, 8, 0, 40, 8, 2, 8, 45, 14, 8, 7, 1, 40, 0, 7, 128, 72, 0, 11, 45, 13, 11, 8, 45, 8, 1, 7, 39, 2, 11, 4, 3, 0, 16, 1, 11, 1, 39, 3, 7, 4, 1, 0, 40, 7, 2, 11, 45, 12, 11, 12, 45, 14, 4, 12, 0, 40, 12, 2, 12, 45, 14, 8, 12, 39, 2, 14, 4, 15, 45, 8, 0, 15, 46, 8, 128, 77, 0, 16, 0, 16, 0, 14, 0, 37, 0, 0, 11, 175, 45, 4, 0, 0, 45, 12, 16, 8, 45, 12, 17, 11, 45, 12, 18, 12, 45, 12, 19, 13, 45, 13, 8, 14, 0, 40, 14, 2, 14, 45, 14, 14, 8, 45, 8, 1, 14, 0, 0, 1, 2, 1, 45, 14, 8, 14, 45, 13, 11, 8, 0, 40, 8, 2, 8, 45, 14, 8, 11, 45, 8, 1, 8, 0, 0, 1, 2, 1, 45, 14, 11, 8, 45, 8, 1, 11, 0, 0, 1, 2, 1, 45, 14, 12, 11, 45, 8, 1, 12, 0, 0, 1, 2, 1, 45, 14, 13, 12, 46, 8, 128, 69, 0, 3, 35, 0, 0, 3, 18, 13, 40, 0, 3, 128, 74, 0, 13, 36, 2, 0, 13, 0, 0, 10, 154, 35, 0, 0, 3, 39, 39, 2, 13, 4, 15, 45, 8, 0, 15, 45, 12, 14, 16, 45, 12, 8, 17, 45, 12, 11, 18, 45, 12, 12, 19, 0, 16, 0, 13, 0, 37, 0, 0, 12, 79, 45, 4, 0, 0, 45, 12, 16, 7, 45, 8, 1, 8, 39, 2, 11, 4, 4, 0, 16, 1, 11, 1, 39, 3, 8, 4, 1, 0, 40, 8, 2, 11, 45, 12, 11, 12, 46, 10, 128, 76, 0, 12, 0, 40, 12, 2, 12, 45, 14, 6, 12, 0, 40, 12, 2, 12, 45, 14, 7, 12, 45, 13, 8, 6, 0, 40, 6, 2, 6, 45, 14, 6, 8, 43, 2, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 39, 2, 14, 4, 15, 45, 8, 0, 15, 45, 12, 6, 16, 0, 16, 0, 14, 0, 37, 0, 0, 11, 175, 45, 4, 0, 0, 45, 12, 16, 7, 45, 12, 17, 11, 45, 12, 18, 12, 45, 12, 19, 13, 45, 13, 7, 6, 0, 40, 6, 2, 6, 45, 14, 6, 7, 45, 8, 1, 6, 0, 0, 1, 2, 1, 45, 14, 7, 6, 45, 13, 11, 7, 0, 40, 7, 2, 7, 45, 14, 7, 11, 45, 8, 1, 7, 0, 0, 1, 2, 1, 45, 14, 11, 7, 45, 8, 1, 11, 0, 0, 1, 2, 1, 45, 14, 12, 11, 45, 8, 1, 12, 0, 0, 1, 2, 1, 45, 14, 13, 12, 46, 8, 128, 69, 0, 3, 35, 0, 0, 4, 44, 13, 40, 0, 3, 128, 67, 0, 13, 36, 2, 0, 13, 0, 0, 10, 39, 35, 0, 0, 4, 65, 39, 2, 8, 4, 13, 45, 8, 0, 13, 45, 12, 6, 14, 45, 12, 7, 15, 45, 12, 11, 16, 45, 12, 12, 17, 0, 16, 0, 8, 0, 37, 0, 0, 12, 79, 45, 4, 0, 0, 45, 12, 14, 3, 10, 56, 9, 3, 6, 36, 2, 0, 6, 0, 0, 4, 126, 37, 0, 0, 12, 195, 11, 40, 0, 10, 128, 70, 0, 3, 30, 2, 0, 6, 1, 10, 56, 10, 6, 7, 18, 56, 3, 7, 6, 36, 2, 0, 6, 0, 0, 4, 162, 37, 0, 0, 12, 213, 48, 4, 0, 5, 128, 73, 48, 0, 128, 70, 128, 75, 30, 2, 0, 3, 5, 28, 12, 3, 6, 4, 28, 12, 6, 5, 0, 41, 2, 0, 3, 0, 59, 154, 202, 4, 47, 12, 0, 3, 0, 6, 11, 40, 0, 6, 128, 70, 0, 7, 36, 2, 0, 7, 0, 0, 4, 225, 37, 0, 0, 12, 231, 40, 2, 0, 6, 0, 222, 173, 48, 12, 0, 6, 0, 3, 43, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 39, 2, 10, 4, 11, 45, 8, 0, 11, 45, 12, 3, 12, 0, 16, 0, 10, 0, 37, 0, 0, 11, 175, 45, 4, 0, 0, 45, 12, 12, 6, 45, 12, 13, 7, 45, 12, 14, 8, 45, 12, 15, 9, 45, 13, 6, 3, 0, 40, 3, 2, 3, 45, 14, 3, 6, 45, 8, 1, 3, 0, 0, 1, 2, 1, 45, 14, 6, 3, 45, 13, 7, 6, 0, 40, 6, 2, 6, 45, 14, 6, 7, 45, 8, 1, 6, 0, 0, 1, 2, 1, 45, 14, 7, 6, 45, 8, 1, 7, 0, 0, 1, 2, 1, 45, 14, 8, 7, 45, 8, 1, 8, 0, 0, 1, 2, 1, 45, 14, 9, 8, 39, 2, 9, 4, 10, 45, 8, 0, 10, 45, 12, 3, 11, 45, 12, 6, 12, 45, 12, 7, 13, 45, 12, 8, 14, 45, 12, 5, 15, 0, 16, 0, 9, 0, 37, 0, 0, 12, 249, 45, 4, 0, 0, 39, 2, 10, 4, 11, 45, 8, 0, 11, 45, 12, 3, 12, 45, 12, 6, 13, 45, 12, 7, 14, 45, 12, 8, 15, 0, 16, 0, 10, 0, 37, 0, 0, 12, 79, 45, 4, 0, 0, 45, 12, 12, 9, 39, 2, 3, 0, 4, 48, 12, 0, 5, 0, 3, 39, 2, 3, 0, 5, 48, 12, 0, 9, 0, 3, 30, 2, 0, 3, 0, 52, 2, 0, 3, 0, 40, 2, 2, 6, 45, 13, 6, 5, 39, 2, 7, 4, 2, 0, 56, 6, 7, 3, 59, 13, 0, 3, 0, 5, 35, 0, 0, 6, 15, 41, 2, 0, 3, 0, 95, 6, 97, 126, 10, 56, 1, 3, 5, 45, 13, 2, 3, 0, 40, 3, 2, 3, 45, 14, 3, 2, 36, 2, 0, 5, 0, 0, 6, 55, 35, 0, 0, 8, 10, 45, 8, 1, 3, 39, 2, 5, 4, 2, 0, 16, 1, 5, 1, 39, 3, 3, 4, 1, 0, 40, 3, 2, 5, 31, 36, 128, 72, 128, 72, 0, 5, 45, 13, 3, 5, 0, 40, 5, 2, 5, 45, 14, 5, 3, 45, 8, 1, 5, 0, 0, 1, 2, 1, 45, 14, 3, 5, 45, 8, 1, 3, 0, 0, 1, 2, 1, 46, 10, 128, 69, 0, 3, 39, 2, 7, 4, 8, 45, 8, 0, 8, 45, 12, 5, 9, 45, 12, 3, 10, 0, 16, 0, 7, 0, 37, 0, 0, 11, 54, 45, 4, 0, 0, 45, 12, 9, 6, 1, 40, 0, 6, 128, 72, 0, 5, 45, 13, 5, 3, 45, 8, 1, 5, 0, 0, 1, 2, 1, 46, 10, 128, 68, 0, 5, 45, 8, 1, 6, 0, 0, 1, 2, 1, 46, 10, 128, 70, 0, 6, 45, 8, 1, 7, 0, 0, 1, 2, 1, 45, 14, 4, 7, 39, 2, 4, 4, 8, 45, 8, 0, 8, 45, 12, 5, 9, 45, 12, 6, 10, 45, 12, 7, 11, 0, 16, 0, 4, 0, 37, 0, 0, 14, 36, 45, 4, 0, 0, 30, 2, 0, 4, 1, 30, 2, 0, 8, 0, 10, 56, 4, 8, 9, 36, 2, 0, 9, 0, 0, 7, 25, 37, 0, 0, 14, 73, 47, 8, 128, 75, 0, 4, 28, 12, 4, 9, 1, 28, 12, 9, 8, 0, 28, 12, 8, 4, 1, 11, 40, 0, 4, 128, 68, 0, 8, 36, 2, 0, 8, 0, 0, 7, 67, 37, 0, 0, 14, 91, 39, 2, 4, 0, 2, 39, 2, 8, 0, 32, 39, 2, 13, 4, 14, 45, 8, 0, 14, 45, 12, 5, 15, 45, 12, 6, 16, 45, 12, 7, 17, 45, 12, 4, 18, 45, 12, 8, 19, 45, 12, 3, 20, 0, 16, 0, 13, 0, 37, 0, 0, 14, 109, 45, 4, 0, 0, 45, 12, 15, 9, 45, 12, 16, 10, 45, 12, 17, 11, 45, 12, 18, 12, 47, 12, 0, 12, 0, 13, 1, 40, 0, 13, 128, 73, 0, 12, 39, 2, 17, 4, 18, 45, 8, 0, 18, 45, 12, 5, 19, 45, 12, 6, 20, 45, 12, 7, 21, 45, 12, 4, 22, 45, 12, 8, 23, 45, 12, 3, 24, 0, 16, 0, 17, 0, 37, 0, 0, 14, 109, 45, 4, 0, 0, 45, 12, 19, 13, 45, 12, 20, 14, 45, 12, 21, 15, 45, 12, 22, 16, 48, 12, 0, 12, 0, 16, 45, 13, 2, 3, 0, 40, 3, 2, 3, 45, 14, 3, 2, 0, 40, 2, 2, 5, 45, 13, 5, 4, 39, 2, 6, 4, 2, 0, 56, 5, 6, 3, 59, 13, 0, 3, 0, 4, 35, 0, 0, 8, 10, 41, 2, 0, 3, 0, 242, 25, 251, 255, 10, 56, 1, 3, 4, 36, 2, 0, 4, 0, 0, 8, 37, 35, 0, 0, 8, 90, 39, 2, 3, 4, 4, 45, 8, 0, 4, 0, 16, 0, 3, 0, 37, 0, 0, 15, 246, 45, 4, 0, 0, 0, 40, 2, 2, 5, 45, 13, 5, 4, 39, 2, 6, 4, 2, 0, 56, 5, 6, 3, 59, 13, 0, 3, 0, 4, 35, 0, 0, 8, 90, 39, 2, 2, 2, 125, 39, 2, 3, 2, 116, 39, 2, 4, 2, 101, 39, 2, 5, 2, 119, 39, 2, 6, 2, 110, 39, 2, 7, 2, 114, 39, 2, 8, 2, 108, 39, 2, 9, 2, 32, 39, 2, 10, 2, 107, 39, 2, 11, 2, 123, 39, 2, 12, 2, 99, 39, 2, 13, 2, 115, 39, 2, 14, 2, 111, 39, 2, 15, 2, 85, 45, 8, 1, 16, 39, 2, 17, 4, 28, 0, 16, 1, 17, 1, 39, 3, 16, 4, 1, 0, 40, 16, 2, 17, 45, 12, 17, 18, 45, 14, 15, 18, 0, 40, 18, 2, 18, 45, 14, 6, 18, 0, 40, 18, 2, 18, 45, 14, 10, 18, 0, 40, 18, 2, 18, 45, 14, 6, 18, 0, 40, 18, 2, 18, 45, 14, 14, 18, 0, 40, 18, 2, 18, 45, 14, 5, 18, 0, 40, 18, 2, 18, 45, 14, 6, 18, 0, 40, 18, 2, 18, 45, 14, 9, 18, 0, 40, 18, 2, 18, 45, 14, 13, 18, 0, 40, 18, 2, 18, 45, 14, 4, 18, 0, 40, 18, 2, 18, 45, 14, 8, 18, 0, 40, 18, 2, 18, 45, 14, 4, 18, 0, 40, 18, 2, 18, 45, 14, 12, 18, 0, 40, 18, 2, 18, 45, 14, 3, 18, 0, 40, 18, 2, 18, 45, 14, 14, 18, 0, 40, 18, 2, 18, 45, 14, 7, 18, 0, 40, 18, 2, 18, 45, 14, 9, 18, 0, 40, 18, 2, 18, 45, 14, 11, 18, 0, 40, 18, 2, 18, 45, 14, 13, 18, 0, 40, 18, 2, 18, 45, 14, 4, 18, 0, 40, 18, 2, 18, 45, 14, 8, 18, 0, 40, 18, 2, 18, 45, 14, 4, 18, 0, 40, 18, 2, 18, 45, 14, 12, 18, 0, 40, 18, 2, 18, 45, 14, 3, 18, 0, 40, 18, 2, 18, 45, 14, 14, 18, 0, 40, 18, 2, 18, 45, 14, 7, 18, 0, 40, 18, 2, 18, 45, 14, 2, 18, 11, 32, 128, 68, 128, 71, 0, 2, 36, 2, 0, 2, 0, 0, 10, 38, 39, 2, 3, 4, 30, 45, 8, 1, 4, 39, 2, 5, 4, 30, 0, 16, 1, 5, 1, 45, 12, 4, 5, 42, 3, 0, 5, 5, 39, 70, 72, 178, 245, 65, 23, 189, 0, 40, 5, 2, 5, 0, 40, 16, 2, 6, 39, 2, 7, 4, 27, 46, 4, 0, 6, 128, 3, 46, 4, 0, 5, 128, 4, 46, 4, 0, 7, 128, 5, 37, 0, 0, 16, 111, 39, 2, 6, 4, 27, 0, 56, 5, 6, 5, 46, 10, 128, 72, 0, 5, 0, 40, 5, 2, 5, 45, 14, 1, 5, 0, 40, 5, 2, 5, 60, 13, 4, 3, 38, 36, 2, 0, 13, 0, 0, 10, 52, 35, 0, 0, 10, 137, 39, 2, 14, 4, 3, 12, 56, 3, 14, 15, 36, 2, 0, 15, 0, 0, 10, 75, 37, 0, 0, 16, 181, 0, 40, 8, 2, 14, 0, 56, 14, 3, 15, 45, 13, 15, 13, 39, 2, 14, 4, 15, 45, 8, 0, 15, 45, 12, 6, 16, 45, 12, 7, 17, 45, 12, 11, 18, 45, 12, 12, 19, 45, 12, 13, 20, 0, 16, 0, 14, 0, 37, 0, 0, 12, 249, 45, 4, 0, 0, 35, 0, 0, 10, 137, 1, 40, 0, 3, 128, 72, 0, 13, 45, 12, 13, 3, 35, 0, 0, 4, 44, 36, 2, 0, 13, 0, 0, 10, 167, 35, 0, 0, 10, 252, 39, 2, 15, 4, 2, 12, 56, 3, 15, 16, 36, 2, 0, 16, 0, 0, 10, 190, 37, 0, 0, 16, 181, 0, 40, 7, 2, 15, 0, 56, 15, 3, 16, 45, 13, 16, 13, 39, 2, 15, 4, 16, 45, 8, 0, 16, 45, 12, 14, 17, 45, 12, 8, 18, 45, 12, 11, 19, 45, 12, 12, 20, 45, 12, 13, 21, 0, 16, 0, 15, 0, 37, 0, 0, 12, 249, 45, 4, 0, 0, 35, 0, 0, 10, 252, 1, 40, 0, 3, 128, 72, 0, 13, 45, 12, 13, 3, 35, 0, 0, 3, 18, 40, 0, 128, 4, 4, 120, 0, 13, 0, 0, 0, 128, 4, 128, 3, 36, 0, 128, 3, 0, 0, 11, 53, 42, 1, 0, 1, 5, 247, 161, 243, 175, 165, 173, 212, 202, 60, 1, 1, 2, 38, 37, 0, 0, 11, 13, 45, 13, 1, 3, 45, 13, 2, 4, 39, 2, 6, 4, 1, 12, 56, 4, 6, 7, 36, 2, 0, 7, 0, 0, 11, 90, 37, 0, 0, 16, 181, 0, 40, 3, 2, 6, 0, 56, 6, 4, 7, 45, 13, 7, 5, 45, 8, 1, 6, 39, 2, 7, 4, 2, 0, 16, 1, 7, 1, 39, 3, 6, 4, 1, 0, 40, 6, 2, 7, 45, 12, 7, 8, 45, 14, 5, 8, 1, 40, 0, 4, 128, 72, 0, 5, 14, 56, 4, 5, 7, 36, 2, 0, 7, 0, 0, 11, 162, 37, 0, 0, 16, 199, 45, 14, 3, 1, 45, 14, 5, 2, 45, 12, 6, 1, 38, 37, 0, 0, 11, 13, 45, 8, 1, 2, 39, 2, 3, 4, 4, 0, 16, 1, 3, 1, 39, 3, 2, 4, 1, 0, 40, 2, 2, 3, 45, 12, 3, 4, 46, 10, 128, 70, 0, 4, 0, 40, 4, 2, 4, 46, 10, 128, 70, 0, 4, 0, 40, 4, 2, 4, 46, 10, 128, 70, 0, 4, 45, 13, 2, 3, 0, 40, 3, 2, 3, 45, 14, 3, 2, 45, 8, 1, 3, 39, 2, 4, 4, 5, 0, 16, 1, 4, 1, 39, 3, 3, 4, 1, 0, 40, 3, 2, 4, 45, 12, 4, 5, 46, 10, 128, 70, 0, 5, 0, 40, 5, 2, 5, 46, 10, 128, 70, 0, 5, 0, 40, 5, 2, 5, 46, 10, 128, 70, 0, 5, 0, 40, 5, 2, 5, 45, 14, 1, 5, 45, 12, 2, 1, 45, 12, 3, 2, 46, 8, 128, 69, 0, 3, 46, 8, 128, 68, 0, 4, 38, 37, 0, 0, 11, 13, 45, 13, 4, 5, 11, 40, 0, 5, 128, 68, 0, 6, 36, 2, 0, 6, 0, 0, 12, 113, 39, 2, 7, 4, 0, 60, 9, 1, 7, 39, 2, 5, 4, 6, 45, 8, 0, 6, 45, 12, 1, 7, 45, 12, 2, 8, 45, 12, 3, 9, 45, 12, 4, 10, 0, 16, 0, 5, 0, 37, 0, 0, 16, 217, 45, 4, 0, 0, 45, 13, 1, 5, 45, 13, 2, 6, 45, 13, 3, 7, 45, 14, 5, 1, 45, 14, 6, 2, 45, 14, 7, 3, 46, 10, 128, 71, 0, 4, 1, 40, 0, 6, 128, 72, 0, 2, 45, 13, 2, 1, 38, 42, 1, 0, 1, 5, 244, 128, 1, 166, 89, 211, 39, 66, 60, 1, 1, 2, 38, 42, 1, 0, 1, 5, 31, 0, 80, 18, 64, 36, 34, 238, 60, 1, 1, 2, 38, 42, 1, 0, 1, 5, 31, 10, 45, 39, 220, 130, 135, 162, 60, 1, 1, 2, 38, 37, 0, 0, 11, 13, 45, 13, 3, 6, 45, 13, 4, 7, 11, 40, 0, 7, 128, 68, 0, 8, 36, 2, 0, 8, 0, 0, 13, 31, 39, 2, 9, 4, 0, 60, 9, 1, 9, 11, 40, 0, 6, 128, 67, 0, 7, 36, 2, 0, 7, 0, 0, 13, 176, 35, 0, 0, 13, 52, 45, 13, 1, 6, 45, 13, 2, 7, 45, 13, 3, 8, 45, 13, 4, 9, 39, 2, 11, 4, 3, 12, 56, 8, 11, 12, 36, 2, 0, 12, 0, 0, 13, 91, 37, 0, 0, 16, 181, 46, 4, 0, 6, 128, 3, 40, 0, 128, 4, 4, 0, 4, 37, 0, 0, 18, 49, 46, 8, 128, 5, 0, 10, 0, 40, 10, 2, 11, 0, 56, 11, 8, 12, 45, 14, 5, 12, 1, 40, 0, 8, 128, 72, 0, 5, 14, 56, 8, 5, 6, 36, 2, 0, 6, 0, 0, 13, 155, 37, 0, 0, 16, 199, 45, 14, 10, 1, 45, 14, 7, 2, 45, 14, 5, 3, 45, 14, 9, 4, 35, 0, 0, 14, 35, 39, 2, 6, 4, 7, 45, 8, 0, 7, 45, 12, 1, 8, 45, 12, 2, 9, 45, 12, 3, 10, 45, 12, 4, 11, 0, 16, 0, 6, 0, 37, 0, 0, 16, 217, 45, 4, 0, 0, 45, 13, 1, 6, 45, 13, 2, 7, 45, 13, 4, 8, 46, 4, 0, 6, 128, 3, 40, 0, 128, 4, 4, 0, 4, 37, 0, 0, 18, 49, 46, 8, 128, 5, 0, 9, 0, 40, 9, 2, 10, 1, 40, 0, 10, 128, 69, 0, 11, 45, 14, 5, 11, 45, 14, 9, 1, 45, 14, 7, 2, 46, 10, 128, 72, 0, 3, 45, 14, 8, 4, 35, 0, 0, 14, 35, 38, 37, 0, 0, 11, 13, 30, 2, 0, 4, 0, 30, 2, 0, 5, 0, 51, 56, 0, 4, 0, 5, 0, 6, 36, 2, 0, 6, 0, 0, 14, 72, 37, 0, 0, 18, 191, 38, 42, 1, 0, 1, 5, 28, 22, 196, 57, 137, 57, 45, 26, 60, 1, 1, 2, 38, 42, 1, 0, 1, 5, 49, 93, 139, 233, 226, 166, 14, 134, 60, 1, 1, 2, 38, 37, 0, 0, 11, 13, 45, 8, 1, 8, 39, 2, 9, 4, 3, 0, 16, 1, 9, 1, 39, 3, 8, 4, 1, 0, 40, 8, 2, 9, 45, 12, 9, 10, 45, 14, 4, 10, 0, 40, 10, 2, 10, 45, 14, 6, 10, 39, 2, 11, 4, 12, 45, 8, 0, 12, 46, 8, 128, 77, 0, 13, 0, 16, 0, 11, 0, 37, 0, 0, 11, 175, 45, 4, 0, 0, 45, 12, 13, 4, 45, 12, 14, 6, 45, 12, 15, 9, 45, 12, 16, 10, 45, 13, 4, 11, 0, 40, 11, 2, 11, 45, 14, 11, 4, 45, 8, 1, 11, 0, 0, 1, 2, 1, 45, 14, 4, 11, 45, 13, 6, 4, 0, 40, 4, 2, 4, 45, 14, 4, 6, 45, 8, 1, 4, 0, 0, 1, 2, 1, 45, 14, 6, 4, 45, 8, 1, 6, 0, 0, 1, 2, 1, 45, 14, 9, 6, 45, 8, 1, 9, 0, 0, 1, 2, 1, 45, 14, 10, 9, 46, 8, 128, 69, 0, 7, 35, 0, 0, 15, 33, 13, 40, 0, 7, 128, 74, 0, 5, 36, 2, 0, 5, 0, 0, 15, 131, 35, 0, 0, 15, 54, 39, 2, 7, 4, 12, 45, 8, 0, 12, 45, 12, 11, 13, 45, 12, 4, 14, 45, 12, 6, 15, 45, 12, 9, 16, 0, 16, 0, 7, 0, 37, 0, 0, 12, 79, 45, 4, 0, 0, 45, 12, 13, 5, 11, 40, 0, 5, 128, 70, 0, 4, 11, 40, 0, 4, 128, 68, 0, 6, 36, 2, 0, 6, 0, 0, 15, 126, 37, 0, 0, 18, 209, 45, 12, 5, 4, 38, 36, 2, 0, 5, 0, 0, 15, 144, 35, 0, 0, 15, 229, 39, 2, 10, 4, 2, 12, 56, 7, 10, 12, 36, 2, 0, 12, 0, 0, 15, 167, 37, 0, 0, 16, 181, 0, 40, 8, 2, 10, 0, 56, 10, 7, 12, 45, 13, 12, 5, 39, 2, 10, 4, 12, 45, 8, 0, 12, 45, 12, 11, 13, 45, 12, 4, 14, 45, 12, 6, 15, 45, 12, 9, 16, 45, 12, 5, 17, 0, 16, 0, 10, 0, 37, 0, 0, 12, 249, 45, 4, 0, 0, 35, 0, 0, 15, 229, 1, 40, 0, 7, 128, 72, 0, 5, 45, 12, 5, 7, 35, 0, 0, 15, 33, 37, 0, 0, 11, 13, 45, 8, 1, 1, 0, 0, 1, 2, 1, 46, 10, 128, 68, 0, 1, 45, 8, 1, 2, 0, 0, 1, 2, 1, 46, 10, 128, 70, 0, 2, 45, 8, 1, 3, 0, 0, 1, 2, 1, 46, 10, 128, 76, 0, 3, 39, 2, 4, 4, 5, 45, 8, 0, 5, 45, 12, 1, 6, 45, 12, 2, 7, 45, 12, 3, 8, 0, 16, 0, 4, 0, 37, 0, 0, 14, 36, 45, 4, 0, 0, 47, 8, 128, 73, 0, 1, 30, 2, 0, 2, 1, 10, 56, 1, 2, 3, 36, 2, 0, 3, 0, 0, 16, 104, 37, 0, 0, 18, 227, 48, 0, 128, 73, 128, 75, 38, 1, 0, 128, 3, 128, 5, 128, 7, 46, 0, 128, 3, 128, 8, 46, 0, 128, 4, 128, 9, 11, 0, 128, 8, 128, 7, 128, 10, 36, 0, 128, 10, 0, 0, 16, 180, 46, 1, 128, 8, 128, 6, 46, 2, 128, 6, 128, 9, 1, 0, 128, 8, 0, 2, 128, 8, 1, 0, 128, 9, 0, 2, 128, 9, 35, 0, 0, 16, 131, 38, 42, 1, 0, 1, 5, 232, 157, 9, 254, 161, 17, 45, 14, 60, 1, 1, 2, 38, 42, 1, 0, 1, 5, 69, 167, 202, 113, 25, 65, 228, 21, 60, 1, 1, 2, 38, 37, 0, 0, 11, 13, 46, 8, 128, 69, 0, 5, 35, 0, 0, 16, 233, 13, 40, 0, 5, 128, 67, 0, 6, 36, 2, 0, 6, 0, 0, 17, 89, 35, 0, 0, 16, 254, 45, 13, 1, 5, 45, 13, 2, 6, 45, 13, 3, 7, 45, 13, 4, 8, 39, 2, 9, 4, 4, 45, 8, 1, 10, 39, 2, 11, 4, 5, 0, 16, 1, 11, 1, 39, 3, 10, 4, 1, 0, 40, 6, 2, 11, 39, 2, 12, 4, 4, 0, 40, 10, 2, 13, 63, 15, 0, 11, 0, 13, 45, 13, 10, 6, 0, 40, 6, 2, 6, 45, 14, 6, 10, 45, 14, 5, 1, 45, 14, 10, 2, 45, 14, 7, 3, 45, 14, 8, 4, 38, 45, 13, 3, 6, 12, 56, 5, 6, 7, 1, 40, 0, 5, 128, 72, 0, 6, 36, 2, 0, 7, 0, 0, 17, 119, 35, 0, 0, 18, 40, 45, 13, 1, 7, 45, 13, 2, 8, 45, 13, 3, 9, 45, 13, 4, 10, 39, 2, 12, 4, 4, 12, 56, 5, 12, 13, 36, 2, 0, 13, 0, 0, 17, 158, 37, 0, 0, 16, 181, 0, 40, 8, 2, 12, 0, 56, 12, 5, 13, 45, 13, 13, 11, 39, 2, 13, 4, 3, 12, 56, 5, 13, 14, 36, 2, 0, 14, 0, 0, 17, 195, 37, 0, 0, 16, 181, 0, 40, 7, 2, 13, 0, 56, 13, 5, 14, 45, 13, 14, 12, 0, 56, 11, 12, 13, 39, 2, 12, 4, 4, 12, 56, 5, 12, 14, 36, 2, 0, 14, 0, 0, 17, 237, 37, 0, 0, 16, 181, 46, 4, 0, 8, 128, 3, 40, 0, 128, 4, 4, 0, 5, 37, 0, 0, 18, 49, 46, 8, 128, 5, 0, 11, 0, 40, 11, 2, 12, 0, 56, 12, 5, 14, 45, 14, 13, 14, 45, 14, 7, 1, 45, 14, 11, 2, 45, 14, 9, 3, 45, 14, 10, 4, 35, 0, 0, 18, 40, 45, 12, 6, 5, 35, 0, 0, 16, 233, 46, 1, 128, 3, 128, 6, 11, 0, 128, 6, 0, 2, 128, 7, 36, 0, 128, 7, 0, 0, 18, 76, 35, 0, 0, 18, 87, 46, 0, 128, 3, 128, 5, 35, 0, 0, 18, 190, 46, 0, 0, 1, 128, 5, 1, 0, 0, 1, 128, 4, 0, 1, 1, 0, 128, 3, 128, 4, 128, 9, 46, 0, 128, 3, 128, 10, 46, 0, 128, 5, 128, 11, 11, 0, 128, 10, 128, 9, 128, 12, 36, 0, 128, 12, 0, 0, 18, 170, 46, 1, 128, 10, 128, 8, 46, 2, 128, 8, 128, 11, 1, 0, 128, 10, 0, 2, 128, 10, 1, 0, 128, 11, 0, 2, 128, 11, 35, 0, 0, 18, 121, 40, 1, 128, 5, 4, 0, 1, 3, 0, 128, 6, 0, 2, 128, 6, 35, 0, 0, 18, 190, 38, 42, 1, 0, 1, 5, 190, 30, 63, 255, 62, 164, 246, 250, 60, 1, 1, 2, 38, 42, 1, 0, 1, 5, 2, 220, 110, 39, 128, 118, 18, 157, 60, 1, 1, 2, 38, 42, 1, 0, 1, 5, 112, 89, 123, 221, 33, 1, 68, 2, 60, 1, 1, 2, 38, 46, 0, 24, 202, 24, 202]
)
