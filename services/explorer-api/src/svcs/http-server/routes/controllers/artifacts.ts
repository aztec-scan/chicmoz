import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { getContractJson } from "../../../../standard-contracts.js";
import { controllers as db } from "../../../database/index.js";
import {
  getArtifactsByArtifactHashSchema,
  postContrctClassStandardArtifactSchema,
} from "../paths_and_validation.js";
import { verifyArtifact } from "./contract-classes.js";
import { dbWrapper } from "./utils/index.js";

export const openapi_GET_L2_ARTIFACTS_BY_ARTIFACT_HASH: OpenAPIObject["paths"] =
  {
    "/l2/artifacts/{artifactHash}": {
      get: {
        tags: ["L2", "artifacts"],
        summary: "Get artifact JSON by artifact hash",
        parameters: [
          {
            name: "artifactHash",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Artifact JSON",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          },
          "404": {
            description: "Artifact not found",
          },
        },
      },
    },
  };

export const GET_L2_ARTIFACTS_BY_ARTIFACT_HASH = asyncHandler(
  async (req, res) => {
    const { artifactHash } = getArtifactsByArtifactHashSchema.parse(req).params;

    const artifactJson = await dbWrapper.get(
      ["l2", "artifacts", artifactHash],
      () => db.l2Contract.getArtifactByHash(artifactHash),
    );

    if (!artifactJson) {
      res.status(404).json({ error: "Artifact not found" });
      return;
    }

    // Return the raw artifact JSON without any wrapper
    res.status(200).json(JSON.parse(artifactJson));
  },
);

export const POST_L2_REGISTERED_CONTRACT_CLASS_STANDARD_ARTIFACT = asyncHandler(
  async (req, res) => {
    const {
      params: { contractClassId, version: classVersion },
      body: { name: standardName, version: standardVersion },
    } = postContrctClassStandardArtifactSchema.parse(req);

    try {
      const contractJson = getContractJson({
        name: standardName,
        version: standardVersion,
      });
      if (!contractJson) {
        res
          .status(404)
          .send(
            `Standard contract ${standardName} version ${standardVersion} not found`,
          );
        return;
      }
      const result = await verifyArtifact({
        contractClassId,
        version: classVersion,
        stringifiedArtifactJson: contractJson,
        standardData: {
          name: standardName,
          version: standardVersion,
        },
      });

      if (result.alreadyExists) {
        res.status(200).json(result.contractClass);
      } else {
        res.status(201).json(result.contractClass);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          res.status(404).send(error.message);
          return;
        }
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
