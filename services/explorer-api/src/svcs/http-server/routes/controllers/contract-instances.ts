import { generateSchema } from "@anatine/zod-openapi";
import {
  VerifyInstanceDeploymentPayload,
  generateVerifyArtifactPayload,
  generateVerifyInstancePayload,
  verifyArtifactPayload,
  verifyInstanceDeploymentPayload,
  verifyInstanceDeploymentPayloadSchema,
} from "@chicmoz-pkg/contract-verification";
import { PublicKeys } from "@aztec/aztec.js/keys";
import { setEntry } from "@chicmoz-pkg/redis-helper";
import {
  NODE_ENV,
  NodeEnv,
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeployedEventSchema,
  type ChicmozL2ContractInstanceDeluxe,
} from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { z } from "zod";
import { CACHE_TTL_SECONDS } from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import {
  getAllProtocolContractInstances,
  getProtocolContractInstance,
} from "../../../../utils/protocol-contracts.js";
import { l2Contract } from "../../../database/controllers/index.js";
import { controllers as db } from "../../../database/index.js";
import {
  getContractInstanceSchema,
  getContractInstancesByBlockHashSchema,
  getContractInstancesByCurrentContractClassIdSchema,
  getContractInstancesSchema,
  getContractInstancesWithAztecScanNotesSchema,
  postVerifiedContractInstanceSchema,
} from "../paths_and_validation.js";
import {
  contractInstanceResponse,
  contractInstanceResponseArray,
  dbWrapper,
} from "./utils/index.js";
import { NoirCompiledContract } from "@aztec/aztec.js/abi";

const verifyContractRequestBody = generateSchema(
  z.object({
    ...postVerifiedContractInstanceSchema.schema.shape.body.shape,
    verifiedDeploymentArguments: verifyInstanceDeploymentPayloadSchema.schema,
  }),
);

const contractClassWithArtifactKeys = (
  contractClassId: string,
  version: number,
) => ["l2", "contract-classes", contractClassId, version, "with-artifact"];

export const openapi_GET_L2_CONTRACT_INSTANCE: OpenAPIObject["paths"] = {
  "/l2/contract-instances/{address}": {
    get: {
      tags: ["L2", "contract-instances"],
      summary: "Get contract instance by address",
      parameters: [
        {
          name: "address",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          name: "includeArtifactJson",
          in: "query",
          schema: {
            type: "boolean",
          },
        },
      ],
      responses: contractInstanceResponse,
    },
    post: {
      description:
        "Please check out our SDK for how to verify contract instance deployment",
      tags: ["L2", "contract-instances"],
      summary: "Verify contract instance deployment",
      parameters: [
        {
          name: "address",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^0x[a-fA-F0-9]+$",
          },
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: verifyContractRequestBody,
          },
        },
      },
      responses: {
        "200": {
          description: "Contract instance verification successful",
        },
        "400": {
          description: "Bad request or verification failed",
        },
        "404": {
          description: "Contract instance not found",
        },
        "500": {
          description: "Internal server error",
        },
      },
    },
  },
};

const contractInstanceKeys = (address: string) => [
  "l2",
  "contract-instances",
  address,
];

export const GET_L2_CONTRACT_INSTANCE = asyncHandler(async (req, res) => {
  const { address } = getContractInstanceSchema.parse(req).params;
  const { includeArtifactJson } = getContractInstanceSchema.parse(req).query;
  const protocolContract = getProtocolContractInstance(address);
  if (protocolContract) {
    res.status(200).json({
      ...protocolContract,
      artifactJson: includeArtifactJson
        ? protocolContract.artifactJson
        : undefined,
    });
    return;
  }
  const instanceData = await dbWrapper.get(contractInstanceKeys(address), () =>
    db.l2Contract.getL2DeployedContractInstanceByAddress(
      address,
      includeArtifactJson,
    ),
  );
  res.status(200).json(JSON.parse(instanceData));
});

export const openapi_GET_L2_CONTRACT_INSTANCES: OpenAPIObject["paths"] = {
  "/l2/contract-instances": {
    get: {
      tags: ["L2", "contract-instances"],
      summary: "Get contract instances between from and to block heights",
      parameters: [
        {
          name: "fromHeight",
          in: "query",
          schema: {
            type: "integer",
          },
        },
        {
          name: "toHeight",
          in: "query",
          schema: {
            type: "integer",
          },
        },
      ],
      responses: contractInstanceResponseArray,
    },
  },
};

export const GET_L2_CONTRACT_INSTANCES = asyncHandler(async (req, res) => {
  const { fromHeight, toHeight, offset, limit, verified, protocol } =
    getContractInstancesSchema.parse(req).query;
  const includeArtifactJson = false;
  const instances = await dbWrapper.getLatest(
    [
      "l2",
      "contract-instances",
      fromHeight,
      toHeight,
      offset,
      limit,
      verified ? "v" : undefined,
      protocol ? "p" : undefined,
    ],
    () =>
      db.l2Contract.getL2DeployedContractInstances({
        fromHeight,
        toHeight,
        includeArtifactJson,
        offset,
        limit,
        verified,
        protocol,
      }),
  );
  const parsedInstances = JSON.parse(
    instances,
  ) as ChicmozL2ContractInstanceDeluxe[];
  // Merge protocol contract instances into the response so they appear in the
  // PROTOCOL filter. Merge when: on the first page (or non-paginated) AND
  // the active filter is NOT "verified" (which would exclude non-verified
  // protocol instances). The "protocol" and "all" filters allow them.
  const excludesProtocol = verified === true;
  const isFirstPageOrNonPaginated = offset === undefined || offset === 0;
  const protocolInstances =
    !excludesProtocol &&
    isFirstPageOrNonPaginated &&
    fromHeight === undefined &&
    toHeight === undefined
      ? getAllProtocolContractInstances()
      : [];
  // Deduplicate: don't add protocol instances that already exist in the DB results
  const dbAddresses = new Set(parsedInstances.map((i) => i.address));
  const merged = [
    ...parsedInstances,
    ...protocolInstances.filter((pi) => !dbAddresses.has(pi.address)),
  ];
  res.status(200).json(merged);
});

export const openapi_GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH: OpenAPIObject["paths"] =
  {
    "/l2/contract-instances/block/{blockHash}": {
      get: {
        tags: ["L2", "contract-instances"],
        summary: "Get contract instances by block hash",
        parameters: [
          {
            name: "blockHash",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "includeArtifactJson",
            in: "query",
            schema: {
              type: "boolean",
            },
          },
        ],
        responses: contractInstanceResponseArray,
      },
    },
  };

export const GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH = asyncHandler(
  async (req, res) => {
    const { blockHash } =
      getContractInstancesByBlockHashSchema.parse(req).params;
    const { includeArtifactJson } =
      getContractInstancesByBlockHashSchema.parse(req).query;
    const instances = await dbWrapper.get(
      ["l2", "contract-instances", "block", blockHash],
      () =>
        db.l2Contract.getL2DeployedContractInstancesByBlockHash(
          blockHash,
          includeArtifactJson,
        ),
    );
    res.status(200).json(JSON.parse(instances));
  },
);

export const openapi_GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/contract-instances": {
      get: {
        tags: ["L2", "contract-instances"],
        summary: "Get contract instances by contract class id",
        parameters: [
          {
            name: "classId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "includeArtifactJson",
            in: "query",
            schema: {
              type: "boolean",
            },
          },
        ],
        responses: contractInstanceResponseArray,
      },
    },
  };

export const GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID = asyncHandler(
  async (req, res) => {
    const { contractClassId } =
      getContractInstancesByCurrentContractClassIdSchema.parse(req).params;
    const includeArtifactJson = false;
    const instances = await dbWrapper.getLatest(
      ["l2", "contract-instances", "class", contractClassId],
      () =>
        db.l2Contract.getL2DeployedContractInstancesByCurrentContractClassId(
          contractClassId,
          includeArtifactJson,
        ),
    );
    res.status(200).json(JSON.parse(instances));
  },
);

export const POST_L2_VERIFY_CONTRACT_INSTANCE_DEPLOYMENT = asyncHandler(
  async (req, res) => {
    const {
      params: { address },
      body: {
        deployerMetadata,
        verifiedDeploymentArguments: {
          publicKeysString,
          salt,
          deployer,
          constructorArgs,
          stringifiedArtifactJson,
        },
      },
    } = postVerifiedContractInstanceSchema.parse(req);
    const instanceData = await dbWrapper.get(
      ["l2", "contract-instances", address],
      () => db.l2Contract.getL2DeployedContractInstanceByAddress(address),
    );

    if (!instanceData || instanceData === undefined) {
      res.status(404).send("Contract instance not found");
      return;
    }

    const dbContractInstance =
      chicmozL2ContractInstanceDeployedEventSchema.parse(
        JSON.parse(instanceData),
      );

    if (publicKeysString) {
      const dbPublicKeys = dbContractInstance.publicKeys;
      const dbPublicKeysString = "0x".concat(
        Object.values(dbPublicKeys)
          .map((key) => key.split("0x")[1])
          .join(""),
      );
      const uploadedPublicKeysMatchDb = publicKeysString === dbPublicKeysString;
      const v5PublicKeysMatchDb = () => {
        const uploadedPublicKeys = PublicKeys.fromString(publicKeysString);
        return (
          uploadedPublicKeys.npkMHash.toString() ===
          dbPublicKeys.masterNullifierPublicKey.slice(0, 66) &&
          uploadedPublicKeys.ivpkM.toString() ===
            dbPublicKeys.masterIncomingViewingPublicKey &&
          uploadedPublicKeys.ovpkMHash.toString() ===
            dbPublicKeys.masterOutgoingViewingPublicKey.slice(0, 66) &&
          uploadedPublicKeys.tpkMHash.toString() ===
            dbPublicKeys.masterTaggingPublicKey.slice(0, 66)
        );
      };

      if (!uploadedPublicKeysMatchDb && !v5PublicKeysMatchDb()) {
        res.status(400).send("Uploaded publicKeys do not match the DB");
        return;
      }
    }

    if (salt && salt !== dbContractInstance.salt) {
      res.status(400).send("Uploaded salt does not match the DB");
      return;
    }

    if (deployer && deployer !== dbContractInstance.deployer) {
      res.status(400).send("Uploaded deployer does not match the DB");
      return;
    }
    const contractClassString = await dbWrapper.get(
      contractClassWithArtifactKeys(
        dbContractInstance.currentContractClassId,
        dbContractInstance.version,
      ),
      () =>
        db.l2Contract.getL2RegisteredContractClass(
          dbContractInstance.currentContractClassId,
          dbContractInstance.version,
        ),
    );
    let dbContractClass;
    try {
      dbContractClass = chicmozL2ContractClassRegisteredEventSchema.parse(
        JSON.parse(contractClassString),
      );
    } catch {
      res.status(500).send("Contract class found in DB is not valid");
      return;
    }

    if (!stringifiedArtifactJson && !dbContractClass.artifactJson) {
      res
        .status(400)
        .send(
          `artifactJson is missing in the request and could not be found for contract class ${dbContractInstance.currentContractClassId} version ${dbContractInstance.version}`,
        );
      return;
    }

    if (stringifiedArtifactJson && dbContractClass.artifactJson) {
      const { isMatchingByteCode } = await verifyArtifactPayload(
        generateVerifyArtifactPayload(
          JSON.parse(stringifiedArtifactJson) as NoirCompiledContract,
        ),
        dbContractClass,
      );
      if (!isMatchingByteCode) {
        res
          .status(400)
          .send(
            "Contract class already has a registered artifact that does not match the uploaded artifact",
          );
        return;
      }
    }

    if (stringifiedArtifactJson && !dbContractClass.artifactJson) {
      // TODO: this entire block should use verify contract class artifact
      const { isMatchingByteCode, artifactContractName } =
        await verifyArtifactPayload(
          generateVerifyArtifactPayload(
            JSON.parse(stringifiedArtifactJson ?? "{}") as NoirCompiledContract,
          ),
          dbContractClass,
        );
      if (!isMatchingByteCode) {
        res.status(400).send("Uploaded artifact does not match contract class");
        return;
      }
      const completeContractClass = {
        ...dbContractClass,
        artifactJson: stringifiedArtifactJson,
        artifactContractName,
      };

      setEntry(
        contractClassWithArtifactKeys(
          dbContractInstance.currentContractClassId,
          dbContractInstance.version,
        ),
        JSON.stringify(completeContractClass),
        CACHE_TTL_SECONDS,
      ).catch((err) => {
        logger.warn(`Failed to cache contract class: ${err}`);
      });
      const { selectorMap } = await db.l2Contract.addArtifactData({
        contractClassId: dbContractClass.contractClassId,
        version: dbContractClass.version,
        artifactJson: stringifiedArtifactJson,
        contractName: artifactContractName,
      });
      await db.l2Contract.backfillPublicCallRequestNames({
        contractClassId: dbContractClass.contractClassId,
        version: dbContractClass.version,
        selectorMap,
        contractName: artifactContractName,
      });
    }

    const artifactString =
      stringifiedArtifactJson ?? dbContractClass.artifactJson;
    if (!artifactString) {
      throw new Error("For some reason artifactString is undefined");
    }

    let verificationPayload: VerifyInstanceDeploymentPayload;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      verificationPayload = generateVerifyInstancePayload({
        publicKeysString,
        deployer,
        salt,
        constructorArgs,
      });
    } catch (error) {
      logger.error(
        `Failed to generate verification payload for contract instance ${address}: ${(error as Error).message}`,
      );
      res.status(400).send((error as Error).message);
      return;
    }

    let isVerifiedDeploymentPayload: boolean;
    try {
      isVerifiedDeploymentPayload = await verifyInstanceDeploymentPayload({
        ...verificationPayload,
        stringifiedArtifactJson: artifactString,
        instanceAddress: address,
        contractClassId: dbContractInstance.currentContractClassId,
        immutablesHash: dbContractInstance.immutablesHash,
      });
    } catch (error) {
      logger.error(
        `Failed to verify instance deployment payload for contract instance ${address}: ${(error as Error).message}`,
      );
      res.status(400).send((error as Error).message);
      return;
    }

    if (!isVerifiedDeploymentPayload) {
      res
        .status(400)
        .send("Uploaded data does not lead to correct contract address");
      return;
    }

    await db.l2Contract.storeContractInstanceVerifiedDeploymentArguments({
      address,
      salt,
      deployer,
      immutablesHash: dbContractInstance.immutablesHash,
      publicKeysString,
      constructorArgs,
    });

    if (!deployerMetadata) {
      const freshInstance =
        await l2Contract.getL2DeployedContractInstanceByAddress(address, true);
      await setEntry(
        contractInstanceKeys(address),
        JSON.stringify(freshInstance),
        CACHE_TTL_SECONDS,
      ).catch((err) => {
        logger.warn(`Failed to cache contract instance(${address}): ${err}`);
      });
      res
        .status(200)
        .send("Contract instance deployment arguments verified and stored");
      return;
    }

    const { aztecScanNotes, ...cleanDeployerMetadata } = deployerMetadata;
    if (NODE_ENV !== NodeEnv.PROD && aztecScanNotes) {
      const aztecScanNotesRes =
        await db.l2.updateContractInstanceAztecScanNotes({
          contractInstanceAddress: address,
          aztecScanNotes,
        });

      if (!aztecScanNotesRes) {
        res.status(500).send("Failed to update aztec scan notes");
        return;
      }
    }

    await db.l2Contract.updateContractInstanceDeployerMetadata({
      address,
      ...cleanDeployerMetadata,
    });

    const newContractInstance =
      await l2Contract.getL2DeployedContractInstanceByAddress(address, true);

    await setEntry(
      contractInstanceKeys(address),
      JSON.stringify(newContractInstance),
      CACHE_TTL_SECONDS,
    ).catch((err) => {
      logger.warn(`Failed to cache contract instance(${address}): ${err}`);
    });

    res.status(200).json(newContractInstance);
  },
);

export const openapi_GET_L2_CONTRACT_INSTANCES_WITH_AZTEC_SCAN_NOTES: OpenAPIObject["paths"] =
  {
    "/l2/contract-instances/with-aztec-scan-notes": {
      get: {
        tags: ["L2", "contract-instances"],
        summary: "Get all contract instances with aztec scan notes",
        parameters: [
          {
            name: "includeArtifactJson",
            in: "query",
            schema: {
              type: "boolean",
            },
          },
        ],
        responses: contractInstanceResponseArray,
      },
    },
  };

export const GET_L2_CONTRACT_INSTANCES_WITH_AZTEC_SCAN_NOTES = asyncHandler(
  async (req, res) => {
    const { includeArtifactJson } =
      getContractInstancesWithAztecScanNotesSchema.parse(req).query;
    const instances = await dbWrapper.getLatest(
      [
        "l2",
        "contract-instances",
        "with-aztec-scan-notes",
        includeArtifactJson ? "with-artifact" : "without-artifact",
      ],
      () =>
        db.l2Contract.getL2DeployedContractInstancesWithAztecScanNotes(
          includeArtifactJson,
        ),
    );
    res.status(200).json(JSON.parse(instances));
  },
);
