import { NoirCompiledContract } from "@aztec/aztec.js";
import {
  VerifyInstanceDeploymentPayload,
  generateVerifyArtifactPayload,
  generateVerifyInstancePayload,
  verifyArtifactPayload,
  verifyInstanceDeploymentPayload,
} from "@chicmoz-pkg/contract-verification";
import { setEntry } from "@chicmoz-pkg/redis-helper";
import {
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeluxeSchema,
  chicmozL2ContractInstanceDeployedEventSchema,
} from "@chicmoz-pkg/types";
import asyncHandler from "express-async-handler";
import { CACHE_TTL_SECONDS } from "../../../../environment.js";
import { logger } from "../../../../logger.js";
import { controllers as db } from "../../../database/index.js";
import {
  getContractInstanceSchema,
  getContractInstancesByBlockHashSchema,
  getContractInstancesByContractClassIdSchema,
  getContractInstancesSchema,
  postVerifiedContractInstanceSchema,
} from "../paths_and_validation.js";
import {
  contractInstanceResponse,
  contractInstanceResponseArray,
  dbWrapper,
} from "./utils/index.js";

export const openapi_GET_L2_CONTRACT_INSTANCE = {
  "/l2/contract-instances/{address}": {
    get: {
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
  const instanceData = await dbWrapper.get(contractInstanceKeys(address), () =>
    db.l2Contract.getL2DeployedContractInstanceByAddress(
      address,
      includeArtifactJson,
    ),
  );
  res.status(200).send(instanceData);
});

export const openapi_GET_L2_CONTRACT_INSTANCES = {
  "/l2/contract-instances/{address}": {
    get: {
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
  const { fromHeight, toHeight } = getContractInstancesSchema.parse(req).query;
  const includeArtifactJson = false;
  const instances = await dbWrapper.getLatest(
    ["l2", "contract-instances", fromHeight, toHeight],
    () =>
      db.l2Contract.getL2DeployedContractInstances({
        fromHeight,
        toHeight,
        includeArtifactJson,
      }),
  );
  res.status(200).send(instances);
});

export const openapi_GET_L2_CONTRACT_INSTANCES_BY_BLOCK_HASH = {
  "/l2/contract-instances/block/{blockHash}": {
    get: {
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
    res.status(200).send(instances);
  },
);

export const openapi_GET_L2_CONTRACT_INSTANCES_BY_CONTRACT_CLASS_ID = {
  "/l2/contract-classes/{classId}/contract-instances": {
    get: {
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
    const { classId } =
      getContractInstancesByContractClassIdSchema.parse(req).params;
    const includeArtifactJson = false;
    const instances = await dbWrapper.getLatest(
      ["l2", "contract-instances", "class", classId],
      () =>
        db.l2Contract.getL2DeployedContractInstancesByContractClassId(
          classId,
          includeArtifactJson,
        ),
    );
    res.status(200).send(instances);
  },
);

export const openapi_POST_L2_VERIFY_CONTRACT_INSTANCE_DEPLOYMENT = {
  "/l2/contract-instances/{contractInstanceAddress}/verified-deployment": {
    get: {
      summary: "Post data to verify contract instance deployment",
      parameters: [
        {
          name: "contractInstanceAddress",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: contractInstanceResponse,
    },
  },
};

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

    const pubkeySplit = Object.values(dbContractInstance.publicKeys).map(
      (key) => key.split("0x")[1],
    );
    const pubKeyString = "0x".concat(pubkeySplit.join(""));

    if (publicKeysString && publicKeysString !== pubKeyString) {
      res.status(400).send("Uploaded publicKeys do not match the DB");
      return;
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
      [
        "l2",
        "contract-classes",
        dbContractInstance.contractClassId,
        dbContractInstance.version,
      ],
      () =>
        db.l2Contract.getL2RegisteredContractClass(
          dbContractInstance.contractClassId,
          dbContractInstance.version,
        ),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    logger.info(JSON.parse(contractClassString!)?.contractType);
    const dbContractClass = chicmozL2ContractClassRegisteredEventSchema.parse(
      JSON.parse(contractClassString!),
    );
    if (!dbContractClass) {
      res.status(500).send("Contract class found in DB is not valid");
      return;
    }

    if (!stringifiedArtifactJson && !dbContractClass.artifactJson) {
      res
        .status(400)
        .send(
          `artifactJson is missing in the request and could not be found for contract class ${dbContractInstance.contractClassId} version ${dbContractInstance.version}`,
        );
      return;
    }

    if (stringifiedArtifactJson && dbContractClass.artifactJson) {
      if (stringifiedArtifactJson !== dbContractClass.artifactJson) {
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
      const { isMatchingByteCode } = await verifyArtifactPayload(
        generateVerifyArtifactPayload(
          JSON.parse(stringifiedArtifactJson ?? "{}") as NoirCompiledContract,
        ),
        dbContractClass,
      );
      if (!isMatchingByteCode) {
        res.status(500).send("Uploaded artifact does not match contract class");
        return;
      }
      const completeContractClass = {
        ...dbContractClass,
        artifactJson: stringifiedArtifactJson,
      };

      setEntry(
        [
          "l2",
          "contract-classes",
          dbContractInstance.contractClassId,
          dbContractInstance.version,
        ],
        JSON.stringify(completeContractClass),
        CACHE_TTL_SECONDS,
      ).catch((err) => {
        logger.warn(`Failed to cache contract class: ${err}`);
      });
      await db.l2Contract.addArtifactJson(
        dbContractClass.contractClassId,
        dbContractClass.version,
        stringifiedArtifactJson,
      );
    }

    const artifactString =
      stringifiedArtifactJson ?? dbContractClass.artifactJson;
    if (!artifactString) {
      throw new Error("For some reason artifactString is undefined");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const verificationPayload: VerifyInstanceDeploymentPayload =
      generateVerifyInstancePayload({
        publicKeysString,
        deployer,
        salt,
        constructorArgs,
      });
    const isVerifiedDeploymentPayload = await verifyInstanceDeploymentPayload({
      ...verificationPayload,
      stringifiedArtifactJson: artifactString,
      instanceAddress: address,
      contractClassId: dbContractInstance.contractClassId,
    });

    if (!isVerifiedDeploymentPayload) {
      res
        .status(500)
        .send("Uploaded data does not lead to correct contract address");
      return;
    }

    await db.l2Contract.storeContractInstanceVerifiedDeploymentArguments({
      address,
      salt,
      deployer,
      publicKeysString,
      constructorArgs,
    });

    if (!deployerMetadata) {
      res
        .status(200)
        .send("Contract instance deployment arguments verified and stored");
      return;
    }

    // Handle contractType (for contract class)
    if (deployerMetadata.contractType !== undefined) {
      // TODO: Implement updating contractType in contract class
      logger.info(
        `Received contractType ${deployerMetadata.contractType} for contract ${address}`,
      );
    }

    // Remove contractType and aztecScanNotes from deployerMetadata
    const { aztecScanNotes, ...cleanDeployerMetadata } = deployerMetadata;

    logger.info(
      `POST_L2_VERIFY_CONTRACT_INSTANCE_DEPLOYMENT: ${JSON.stringify(
        aztecScanNotes,
      )}`,
    );
    if (aztecScanNotes?.origin) {
      await db.l2Contract
        .storeContractInstanceAztecScanNotes({
          address,
          aztecScanNotes,
        })
        .catch((err) => {
          logger.warn(`Failed to store origin notes: ${err}`);
        });
    }

    const metaDataStoreRes =
      await db.l2Contract.updateContractInstanceDeployerMetadata({
        address,
        ...cleanDeployerMetadata,
      });

    if (!metaDataStoreRes) {
      res.status(500).send("Failed to update deployer metadata");
      return;
    }

    const newContractInstance = JSON.stringify(
      chicmozL2ContractInstanceDeluxeSchema.parse({
        ...dbContractInstance,
        ...dbContractClass,
        verifiedDeploymentArguments: {
          ...verificationPayload,
          address,
          stringifiedArtifactJson: artifactString,
        },
        deployerMetadata: {
          ...deployerMetadata,
          address,
          uploadedAt: metaDataStoreRes.uploadedAt,
        },
      }),
    );

    await setEntry(
      contractInstanceKeys(address),
      newContractInstance,
      CACHE_TTL_SECONDS,
    ).catch((err) => {
      logger.warn(`Failed to cache contract instance(${address}): ${err}`);
    });

    res.status(200).send("Contract instance registered");
  },
);
