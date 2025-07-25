import { z } from "zod";
import { aztecAddressSchema } from "../general.js";
import { chicmozL2BlockSchema } from "./l2Block.js";
import { aztecScanNoteSchema } from "./special.js";
import {
  bufferSchema,
  concatFrPointSchema,
  frSchema,
  frTimestampSchema,
} from "./utils.js";

export const chicmozL2ContractInstanceDeployedEventSchema = z.object({
  address: aztecAddressSchema,
  blockHash: chicmozL2BlockSchema.shape.hash,
  version: z.number(), // TODO: rename to contractClassVersion
  salt: frSchema,
  currentContractClassId: frSchema,
  originalContractClassId: frSchema,
  initializationHash: frSchema,
  deployer: aztecAddressSchema,
  aztecScanNotes: aztecScanNoteSchema.optional(),
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

export const chicmozL2ContractInstanceUpdatedEventSchema = z.object({
  address: aztecAddressSchema,
  prevContractClassId: frSchema,
  newContractClassId: frSchema,
  timestampOfChange: frTimestampSchema,
  blockHash: chicmozL2BlockSchema.shape.hash,
});

export type ChicmozL2ContractInstanceUpdatedEvent = z.infer<
  typeof chicmozL2ContractInstanceUpdatedEventSchema
>;

export const chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema =
  z.object({
    id: z.string().uuid().optional(),
    address: aztecAddressSchema,
    salt: frSchema,
    deployer: aztecAddressSchema,
    publicKeysString: z.string(),
    constructorArgs: z.string().array(),
  });

export type ChicmozL2ContractInstanceVerifiedDeploymentArgumnetsSchema =
  z.infer<typeof chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema>;

export const chicmozL2ContractClassRegisteredEventSchema = z.object({
  blockHash: chicmozL2BlockSchema.shape.hash,
  contractClassId: frSchema,
  version: z.number(),
  artifactHash: frSchema,
  privateFunctionsRoot: frSchema,
  packedBytecode: bufferSchema,
  artifactJson: z.string().nullable().optional(),
  artifactContractName: z.string().nullable().optional(),
  standardContractType: z.string().nullable().optional(),
  standardContractVersion: z.string().nullable().optional(),
  sourceCodeUrl: z.string().nullable().optional(),
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
  utilityFunctionsTreeRoot: frSchema,
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

export const chicmozL2UtilityFunctionBroadcastedEventSchema = z.object({
  contractClassId:
    chicmozL2ContractClassRegisteredEventSchema.shape.contractClassId,
  artifactMetadataHash: frSchema,
  privateFunctionsArtifactTreeRoot: frSchema,
  artifactFunctionTreeSiblingPath: z.array(frSchema), // TODO: is it fixed size?
  artifactFunctionTreeLeafIndex: z.number(),
  utilityFunction: z.object({
    selector: functionSelectorSchema,
    metadataHash: frSchema,
    bytecode: bufferSchema,
  }),
});

export type ChicmozL2UtilityFunctionBroadcastedEvent = z.infer<
  typeof chicmozL2UtilityFunctionBroadcastedEventSchema
>;

export const CONTRACT_STANDARDS = {
  "0.0.0-73e84dcc": ["token", "dripper"],
};

export const contractStandardVersionSchema = z.enum(
  Object.keys(CONTRACT_STANDARDS) as [keyof typeof CONTRACT_STANDARDS],
);

export type ContractStandardVersion = keyof typeof CONTRACT_STANDARDS;

export const contractStandardNameSchema = <V extends ContractStandardVersion>(
  version: V,
) => z.enum(CONTRACT_STANDARDS[version] as [string, ...string[]]);

export const contractStandardSchema = z
  .object({
    version: contractStandardVersionSchema,
    name: z.string(),
  })
  .refine(
    (data) =>
      CONTRACT_STANDARDS[data.version as ContractStandardVersion].includes(
        data.name,
      ),
    {
      message: "Contract name is not valid for the specified version",
      path: ["name"],
    },
  );

export type ContractStandardName<V extends ContractStandardVersion> =
  (typeof CONTRACT_STANDARDS)[V][number];

export type ContractStandard = z.infer<typeof contractStandardSchema>;
