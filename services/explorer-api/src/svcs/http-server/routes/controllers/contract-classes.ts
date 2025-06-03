import { NoirCompiledContract } from "@aztec/aztec.js";
import { verifyArtifactPayload } from "@chicmoz-pkg/contract-verification";
import { setEntry } from "@chicmoz-pkg/redis-helper";
import {
  chicmozL2ContractClassRegisteredEventSchema,
  ContractStandard,
} from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { CACHE_TTL_SECONDS } from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import { controllers as db } from "../../../database/index.js";
import {
  getContractClassesByCurrentClassIdSchema,
  getContractClassSchema,
  postContrctClassArtifactSchema,
} from "../paths_and_validation.js";
import {
  contractClassResponse,
  contractClassResponseArray,
  dbWrapper,
} from "./utils/index.js";

export const openapi_GET_L2_REGISTERED_CONTRACT_CLASS: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/versions/{version}": {
      get: {
        tags: ["L2", "contract-classes"],
        summary:
          "Get registered contract class by contract class id and version",
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
            name: "version",
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
        responses: contractClassResponse,
      },
    },
  };

export const GET_L2_REGISTERED_CONTRACT_CLASS = asyncHandler(
  async (req, res) => {
    const { contractClassId, version } =
      getContractClassSchema.parse(req).params;
    const { includeArtifactJson } = getContractClassSchema.parse(req).query;
    const contractClass = await dbWrapper.get(
      ["l2", "contract-classes", contractClassId, version],
      () =>
        db.l2Contract.getL2RegisteredContractClass(
          contractClassId,
          version,
          includeArtifactJson,
        ),
    );
    res.status(200).json(JSON.parse(contractClass));
  },
);

export const openapi_GET_L2_REGISTERED_CONTRACT_CLASSES_ALL_VERSIONS: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}": {
      get: {
        tags: ["L2", "contract-classes"],
        summary:
          "Get all versions of registered contract classes by contract class id",
        parameters: [
          {
            name: "classId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: contractClassResponseArray,
      },
    },
  };

export const GET_L2_REGISTERED_CONTRACT_CLASSES_ALL_VERSIONS = asyncHandler(
  async (req, res) => {
    const { contractClassId } =
      getContractClassesByCurrentClassIdSchema.parse(req).params;
    const includeArtifactJson = false;
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes", contractClassId],
      () =>
        db.l2Contract.getL2RegisteredContractClasses({
          contractClassId,
          includeArtifactJson,
        }),
    );
    res.status(200).json(JSON.parse(contractClasses));
  },
);

export const openapi_GET_L2_REGISTERED_CONTRACT_CLASSES: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes": {
      get: {
        tags: ["L2", "contract-classes"],
        summary: "Get latest registered contract classes",
        responses: contractClassResponseArray,
      },
    },
  };

export const GET_L2_REGISTERED_CONTRACT_CLASSES = asyncHandler(
  async (_req, res) => {
    const includeArtifactJson = false;
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes"],
      () =>
        db.l2Contract.getL2RegisteredContractClasses({ includeArtifactJson }),
    );
    res.status(200).json(JSON.parse(contractClasses));
  },
);

export const openapi_POST_L2_REGISTERED_CONTRACT_CLASS_ARTIFACT: OpenAPIObject["paths"] =
  {
    "/l2/contract-classes/{classId}/versions/{version}": {
      post: {
        description:
          "Please check out our SDK for how to verify contract class artifact",
        tags: ["L2", "contract-classes"],
        summary: "Register and verify contract class artifact",
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
            name: "version",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  stringifiedArtifactJson: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: contractClassResponse,
      },
    },
  };

export const verifyArtifact = async ({
  contractClassId,
  version,
  stringifiedArtifactJson,
  standardData,
}: {
  contractClassId: string;
  version: number;
  stringifiedArtifactJson: string | NoirCompiledContract;
  standardData?: ContractStandard;
}) => {
  const contractClassString = await dbWrapper.get(
    ["l2", "contract-classes", contractClassId, version],
    () => db.l2Contract.getL2RegisteredContractClass(contractClassId, version),
  );

  let dbContractClass;
  if (contractClassString) {
    dbContractClass = chicmozL2ContractClassRegisteredEventSchema.parse(
      JSON.parse(contractClassString),
    );
    if (dbContractClass.artifactJson) {
      return {
        success: true,
        alreadyExists: true,
        contractClass: dbContractClass,
      };
    }
  }

  if (!dbContractClass) {
    throw new Error("Contract class found in DB is not valid");
  }

  const artifactJsonString =
    typeof stringifiedArtifactJson === "string"
      ? stringifiedArtifactJson
      : JSON.stringify(stringifiedArtifactJson);

  if (!artifactJsonString) {
    throw new Error("Missing artifact json");
  }

  const { isMatchingByteCode } = await verifyArtifactPayload(
    { stringifiedArtifactJson: artifactJsonString },
    dbContractClass,
  );

  if (!isMatchingByteCode) {
    throw new Error("Incorrect artifact");
  }

  const parsed = JSON.parse(
    artifactJsonString,
  ) as unknown as NoirCompiledContract;

  const completeContractClass = {
    ...dbContractClass,
    artifactJson: artifactJsonString,
    artifactContractName: parsed.name,
    standardContractType: standardData?.name ?? null,
    standardContractVersion: standardData?.version ?? null,
  };

  setEntry(
    ["l2", "contract-classes", contractClassId, version.toString()],
    JSON.stringify(completeContractClass),
    CACHE_TTL_SECONDS,
  ).catch((err) => {
    logger.warn(`Failed to cache contract class: ${err}`);
  });

  await db.l2Contract.addArtifactData({
    contractClassId: dbContractClass.contractClassId,
    version: dbContractClass.version,
    artifactJson: artifactJsonString,
    contractName: parsed.name,
    standardData: standardData,
  });

  return {
    success: true,
    alreadyExists: false,
    contractClass: completeContractClass,
  };
};

export const POST_L2_REGISTERED_CONTRACT_CLASS_ARTIFACT = asyncHandler(
  async (req, res) => {
    const {
      params: { contractClassId, version },
      body,
    } = postContrctClassArtifactSchema.parse(req);

    if (!body.stringifiedArtifactJson) {
      res.status(400).send("Missing artifact json");
      return;
    }

    try {
      const result = await verifyArtifact({
        contractClassId,
        version,
        stringifiedArtifactJson: body.stringifiedArtifactJson,
      });

      if (result.alreadyExists) {
        res.status(200).json(result.contractClass);
      } else {
        res.status(201).json(result.contractClass);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Contract class found in DB is not valid") {
          res.status(500).send(error.message);
          return;
        }
        if (
          error.message === "Missing artifact json" ||
          error.message === "Incorrect artifact"
        ) {
          res.status(400).send(error.message);
          return;
        }
      }
      throw error;
    }
  },
);
