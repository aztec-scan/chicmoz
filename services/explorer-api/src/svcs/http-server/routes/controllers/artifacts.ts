import asyncHandler from "express-async-handler";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { controllers as db } from "../../../database/index.js";
import { getArtifactsByArtifactHashSchema } from "../paths_and_validation.js";
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
