import asyncHandler from "express-async-handler";
import { randomUUID } from "crypto";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { logger } from "../../../../logger.js";
import { controllers as db } from "../../../database/index.js";
import { publishMessage } from "../../../message-bus/index.js";
import {
  getContractClassSourceSchema,
  getVerifySourceJobSchema,
  postVerifySourceSchema,
} from "../paths_and_validation.js";

const MAX_CONCURRENT_JOBS_PER_IP = 3;

const getClientIp = (req: { ip?: string }): string => {
  return req.ip ?? "unknown";
};

export const openapi_POST_VERIFY_SOURCE: OpenAPIObject["paths"] = {
  "/l2/contract-classes/{classId}/versions/{version}/verify-source": {
    post: {
      tags: ["L2", "contract-classes", "source-verification"],
      summary: "Submit a source code verification request",
      parameters: [
        {
          name: "classId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "version",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                githubUrl: { type: "string" },
                gitRef: { type: "string" },
                subPath: { type: "string" },
                aztecVersion: { type: "string" },
              },
              required: ["githubUrl"],
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Source code already verified",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  jobId: { type: "string", nullable: true },
                  status: { type: "string" },
                  sourceCodeUrl: { type: "string" },
                },
              },
            },
          },
        },
        "202": {
          description: "Verification job created",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  jobId: { type: "string" },
                  status: { type: "string" },
                },
              },
            },
          },
        },
        "400": { description: "Invalid request" },
        "404": { description: "Contract class not found" },
        "429": { description: "Too many concurrent verification requests" },
      },
    },
  },
};

export const POST_VERIFY_SOURCE = asyncHandler(async (req, res) => {
  const {
    params: { contractClassId, version },
    body: { githubUrl, gitRef, subPath, aztecVersion },
  } = postVerifySourceSchema.parse(req);

  // Rate limit by IP (DB-backed — survives restarts and self-cleans as jobs complete)
  const clientIp = getClientIp(req);
  const currentCount = await db.l2Contract.getActiveJobCountByIp(clientIp);
  if (currentCount >= MAX_CONCURRENT_JOBS_PER_IP) {
    res.status(429).json({
      error:
        "Too many concurrent verification requests. Please try again later.",
    });
    return;
  }

  // Verify the contract class exists in the DB
  const contractClass = await db.l2Contract.getL2RegisteredContractClass(
    contractClassId,
    version,
  );
  if (!contractClass) {
    res.status(404).json({ error: "Contract class not found" });
    return;
  }

  // Check if source code is already verified — return a consistent response shape
  if (contractClass.sourceCodeUrl) {
    res.status(200).json({
      jobId: null,
      status: "VERIFIED",
      sourceCodeUrl: contractClass.sourceCodeUrl,
    });
    return;
  }

  // Validate GitHub URL format — only allow https://github.com/<owner>/<repo> (optional .git / trailing slash)
  const githubUrlPattern =
    /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/;
  if (!githubUrlPattern.test(githubUrl)) {
    res.status(400).json({
      error: "Invalid GitHub URL. Must be a public GitHub repository URL.",
    });
    return;
  }

  const jobId = randomUUID();

  // Create job record in DB
  await db.l2Contract.createSourceVerificationJob({
    id: jobId,
    contractClassId,
    version,
    githubUrl,
    gitRef,
    subPath,
    aztecVersion,
    clientIp,
  });

  // Publish compile request to Kafka
  try {
    await publishMessage("COMPILE_SOURCE_REQUEST_EVENT", {
      jobId,
      contractClassId,
      version,
      githubUrl,
      gitRef,
      subPath,
      aztecVersion,
    });

    // Update job status to COMPILING now that the request has been published
    await db.l2Contract.updateSourceVerificationJobStatus({
      jobId,
      status: "COMPILING",
    });
  } catch (error) {
    logger.error(
      `Failed to publish compile request for job ${jobId}: ${String(error)}`,
    );
    await db.l2Contract.updateSourceVerificationJobStatus({
      jobId,
      status: "FAILED",
      error: "Failed to submit compilation request",
    });
    res.status(500).json({ error: "Failed to submit compilation request" });
    return;
  }

  logger.info(
    `Source verification job ${jobId} created for contract class ${contractClassId}@${version}`,
  );

  res.status(202).json({
    jobId,
    status: "PENDING",
  });
});

export const openapi_GET_VERIFY_SOURCE_JOB: OpenAPIObject["paths"] = {
  "/l2/contract-classes/{classId}/versions/{version}/verify-source/{jobId}": {
    get: {
      tags: ["L2", "contract-classes", "source-verification"],
      summary: "Get the status of a source verification job",
      parameters: [
        {
          name: "classId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "version",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "jobId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Verification job status",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  contractClassId: { type: "string" },
                  version: { type: "number" },
                  githubUrl: { type: "string" },
                  gitRef: { type: "string", nullable: true },
                  subPath: { type: "string", nullable: true },
                  aztecVersion: { type: "string" },
                  status: { type: "string" },
                  commitHash: { type: "string", nullable: true },
                  error: { type: "string", nullable: true },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
          },
        },
        "404": { description: "Job not found" },
      },
    },
  },
};

export const GET_VERIFY_SOURCE_JOB = asyncHandler(async (req, res) => {
  const {
    params: { contractClassId, version, jobId },
  } = getVerifySourceJobSchema.parse(req);

  const job = await db.l2Contract.getSourceVerificationJob(jobId);
  if (!job) {
    res.status(404).json({ error: "Verification job not found" });
    return;
  }

  // Validate that the job belongs to the contract class/version in the URL
  if (job.contractClassId !== contractClassId || job.version !== version) {
    res.status(404).json({ error: "Verification job not found" });
    return;
  }

  res.status(200).json({
    id: job.id,
    contractClassId: job.contractClassId,
    version: job.version,
    githubUrl: job.githubUrl,
    gitRef: job.gitRef,
    subPath: job.subPath,
    aztecVersion: job.aztecVersion,
    commitHash: job.commitHash,
    status: job.status,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

export const openapi_GET_CONTRACT_CLASS_SOURCE: OpenAPIObject["paths"] = {
  "/l2/contract-classes/{classId}/versions/{version}/source": {
    get: {
      tags: ["L2", "contract-classes", "source-verification"],
      summary: "Get verified source code for a contract class",
      parameters: [
        {
          name: "classId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "version",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Verified source code",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  contractClassId: { type: "string" },
                  version: { type: "number" },
                  sourceCodeUrl: { type: "string" },
                  sourceCodeCommitHash: { type: "string", nullable: true },
                  sourceCode: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string" },
                        content: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "404": {
          description: "Contract class not found or source not verified",
        },
      },
    },
  },
};

export const GET_CONTRACT_CLASS_SOURCE = asyncHandler(async (req, res) => {
  const {
    params: { contractClassId, version },
  } = getContractClassSourceSchema.parse(req);

  const contractClass = await db.l2Contract.getL2RegisteredContractClass(
    contractClassId,
    version,
    false,
  );

  if (!contractClass) {
    res.status(404).json({ error: "Contract class not found" });
    return;
  }

  if (!contractClass.sourceCodeUrl) {
    res.status(404).json({
      error: "Source code has not been verified for this contract class",
    });
    return;
  }

  // We need to query the DB directly for the sourceCode jsonb field
  // since it's not part of the standard contract class schema
  const sourceData = await db.l2Contract.getContractClassSourceCode(
    contractClassId,
    version,
  );

  res.status(200).json({
    contractClassId,
    version,
    sourceCodeUrl: contractClass.sourceCodeUrl,
    sourceCodeCommitHash: sourceData.sourceCodeCommitHash,
    sourceCode: sourceData.sourceCode,
  });
});
