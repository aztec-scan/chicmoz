import { z } from "zod";
import { aztecAddressSchema } from "../general.js";
import { chicmozL2BlockSchema } from "./l2Block.js";
import { bufferSchema, concatFrPointSchema, frSchema } from "./utils.js";

export const chicmozL2ContractInstanceDeployedEventSchema = z.object({
  address: aztecAddressSchema,
  blockHash: chicmozL2BlockSchema.shape.hash,
  version: z.number(), // TODO: rename to contractClassVersion
  salt: frSchema,
  contractClassId: frSchema,
  initializationHash: frSchema,
  deployer: aztecAddressSchema,
  publicKeys: z.object({
    masterNullifierPublicKey: concatFrPointSchema,
    masterIncomingViewingPublicKey: concatFrPointSchema,
    masterOutgoingViewingPublicKey: concatFrPointSchema,
    masterTaggingPublicKey: concatFrPointSchema,
  }),
});

export type ChicmozL2ContractInstanceDeployedEvent = z.infer<
  typeof chicmozL2ContractInstanceDeployedEventSchema
>;

export const chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema = z.object({
  id: z.string().uuid().optional(),
  address: aztecAddressSchema,
  salt: frSchema,
  deployer: aztecAddressSchema,
  publicKeysString: z.string(),
  constructorArgs: z.string().array(),
});

export type ChicmozL2ContractInstanceVerifiedDeploymentArgumnetsSchema = z.infer<
  typeof chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema
>;

export const chicmozL2ContractClassRegisteredEventSchema = z.object({
  blockHash: chicmozL2BlockSchema.shape.hash,
  contractClassId: frSchema,
  version: z.number(),
  artifactHash: frSchema,
  privateFunctionsRoot: frSchema,
  packedBytecode: bufferSchema,
  artifactJson: z.string().nullable().optional(),
  artifactContractName: z.string().nullable().optional(),
  isToken: z.boolean().nullable().optional(),
  whyNotToken: z.string().nullable().optional(),
});

export type ChicmozL2ContractClassRegisteredEvent = z.infer<
  typeof chicmozL2ContractClassRegisteredEventSchema
>;

const functionSelectorSchema = z.object({
  value: z.number(),
});

export const chicmozL2PrivateFunctionBroadcastedEventSchema = z.object({
  contractClassId:
    chicmozL2ContractClassRegisteredEventSchema.shape.contractClassId,
  artifactMetadataHash: frSchema,
  unconstrainedFunctionsArtifactTreeRoot: frSchema,
  privateFunctionTreeSiblingPath: z.array(frSchema), // TODO: is it fixed size?
  privateFunctionTreeLeafIndex: z.number(),
  artifactFunctionTreeSiblingPath: z.array(frSchema), // TODO: is it fixed size?
  artifactFunctionTreeLeafIndex: z.number(),
  privateFunction: z.object({
    selector: functionSelectorSchema,
    metadataHash: frSchema,
    vkHash: frSchema,
    bytecode: bufferSchema,
  }),
});

export type ChicmozL2PrivateFunctionBroadcastedEvent = z.infer<
  typeof chicmozL2PrivateFunctionBroadcastedEventSchema
>;

export const chicmozL2UnconstrainedFunctionBroadcastedEventSchema = z.object({
  contractClassId:
    chicmozL2ContractClassRegisteredEventSchema.shape.contractClassId,
  artifactMetadataHash: frSchema,
  privateFunctionsArtifactTreeRoot: frSchema,
  artifactFunctionTreeSiblingPath: z.array(frSchema), // TODO: is it fixed size?
  artifactFunctionTreeLeafIndex: z.number(),
  unconstrainedFunction: z.object({
    selector: functionSelectorSchema,
    metadataHash: frSchema,
    bytecode: bufferSchema,
  }),
});

export type ChicmozL2UnconstrainedFunctionBroadcastedEvent = z.infer<
  typeof chicmozL2UnconstrainedFunctionBroadcastedEventSchema
>;
