import { NoirCompiledContract } from "@aztec/aztec.js";
import {
  IsTokenArtifactResult,
  isTokenArtifact,
  verifyArtifactPayload,
} from "@chicmoz-pkg/contract-verification";
import { setEntry } from "@chicmoz-pkg/redis-helper";
import { chicmozL2ContractClassRegisteredEventSchema } from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { CACHE_TTL_SECONDS } from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import { controllers as db } from "../../../database/index.js";
import {
  getContractClassSchema,
  getContractClassesByClassIdSchema,
  postContrctClassArtifactSchema,
} from "../paths_and_validation.js";
import {
  contractClassResponse,
  contractClassResponseArray,
  dbWrapper,
} from "./utils/index.js";

export const openapi_GET_L2_REGISTERED_CONTRACT_CLASS = {
  "/l2/contract-classes/{classId}/versions/{version}": {
    get: {
      summary: "Get registered contract class by contract class id and version",
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
      responses: contractClassResponse,
    },
  },
};

export const GET_L2_REGISTERED_CONTRACT_CLASS = asyncHandler(
  async (req, res) => {
    const { classId, version } = getContractClassSchema.parse(req).params;
    const contractClass = await dbWrapper.get(
      ["l2", "contract-classes", classId, version],
      () => db.l2Contract.getL2RegisteredContractClass(classId, version)
    );
    res.status(200).send(contractClass);
  }
);

export const openapi_GET_L2_REGISTERED_CONTRACT_CLASSES_ALL_VERSIONS = {
  "/l2/contract-classes/{classId}": {
    get: {
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
    const { classId } = getContractClassesByClassIdSchema.parse(req).params;
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes", classId],
      () => db.l2Contract.getL2RegisteredContractClasses(classId)
    );
    res.status(200).send(contractClasses);
  }
);

export const openapi_GET_L2_REGISTERED_CONTRACT_CLASSES = {
  "/l2/contract-classes": {
    get: {
      summary: "Get latest registered contract classes",
      responses: contractClassResponseArray,
    },
  },
};

export const GET_L2_REGISTERED_CONTRACT_CLASSES = asyncHandler(
  async (_req, res) => {
    const contractClasses = await dbWrapper.getLatest(
      ["l2", "contract-classes"],
      () => db.l2Contract.getL2RegisteredContractClasses()
    );
    // eslint-disable-next-line no-console
    console.log(
      z
        .array(chicmozL2ContractClassRegisteredEventSchema)
        .parse(JSON.parse(contractClasses ?? "[]"))
        .map((x) => ({
          ...x,
          artifactJson: "artifactJson",
          packedBytecode: "packedBytecode",
        }))
    );
    res.status(200).send(contractClasses);
  }
);

export const openapi_POST_L2_REGISTERED_CONTRACT_CLASS_ARTIFACT = {
  "/l2/contract-classes/{classId}/versions/{version}/artifact": {
    post: {
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

export const POST_L2_REGISTERED_CONTRACT_CLASS_ARTIFACT = asyncHandler(
  async (req, res) => {
    const {
      params: { classId, version },
      body,
    } = postContrctClassArtifactSchema.parse(req);

    const contractClassString = await dbWrapper.get(
      ["l2", "contract-classes", classId, version],
      () => db.l2Contract.getL2RegisteredContractClass(classId, version)
    );
    let dbContractClass;
    if (contractClassString) {
      dbContractClass = chicmozL2ContractClassRegisteredEventSchema.parse(
        JSON.parse(contractClassString)
      );
      if (dbContractClass.artifactJson) {
        res.status(200).send(dbContractClass);
        return;
      }
    }
    if (!dbContractClass) {
      res.status(500).send("Contract class found in DB is not valid");
      return;
    }
    if (!body.stringifiedArtifactJson) {
      // TODO: zod validation before endpoint?
      res.status(400).send("Missing artifact json");
      return;
    }
    const { isMatchingByteCode, artifactContractName } =
      await verifyArtifactPayload(body, dbContractClass);
    if (!isMatchingByteCode) throw new Error("Incorrect artifact");
    const completeContractClass = {
      ...dbContractClass,
      artifactJson: body.stringifiedArtifactJson,
    };

    setEntry(
      ["l2", "contract-classes", classId, version.toString()],
      JSON.stringify(completeContractClass),
      CACHE_TTL_SECONDS
    ).catch((err) => {
      logger.warn(`Failed to cache contract class: ${err}`);
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const isTokenRes: IsTokenArtifactResult = isTokenArtifact(
      JSON.parse(
        body.stringifiedArtifactJson
      ) as unknown as NoirCompiledContract
    );
    // eslint-disable-next-line no-console
    console.log(`\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
                ${artifactContractName}
    ${JSON.stringify(isTokenRes)}
    ///////////////////////////`);
    await db.l2Contract.addArtifactJson(
      dbContractClass.contractClassId,
      dbContractClass.version,
      body.stringifiedArtifactJson,
      artifactContractName,
      isTokenRes
    );
    res.status(201).send(completeContractClass);
  }
);
