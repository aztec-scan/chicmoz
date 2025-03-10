import { z } from "zod";
import {
  chicmozL2RpcNodeErrorSchema,
  chicmozL2SequencerSchema,
} from "./general.js";
import { chicmozL2BlockSchema } from "./l2Block.js";
import {
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeployedEventSchema,
  chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema,
} from "./l2Contract.js";
import { chicmozL2TxEffectSchema } from "./l2TxEffect.js";

export const chicmozL2ContractInstanceDeployerMetadataSchema = z.object({
  // TODO: update schema with better/more info
  address: z.lazy(
    () => chicmozL2ContractInstanceDeployedEventSchema.shape.address
  ),
  contractIdentifier: z.string(),
  details: z.string(),
  creatorName: z.string(),
  creatorContact: z.string(),
  appUrl: z.string(),
  repoUrl: z.string(),
  uploadedAt: z.coerce.date(),
  reviewedAt: z.coerce.date().optional(),
});

export type ChicmozL2ContractInstanceDeployerMetadata = z.infer<
  typeof chicmozL2ContractInstanceDeployerMetadataSchema
>;

export const chicmozL2ContractInstanceDeluxeSchema = z.object({
  ...chicmozL2ContractInstanceDeployedEventSchema.shape,
  ...chicmozL2ContractClassRegisteredEventSchema.shape,
  blockHeight: chicmozL2BlockSchema.shape.height.optional(),
  deployerMetadata: chicmozL2ContractInstanceDeployerMetadataSchema.optional(),
  verifiedDeploymentArguments:
    chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema.optional(),
});

export type ChicmozL2ContractInstanceDeluxe = z.infer<
  typeof chicmozL2ContractInstanceDeluxeSchema
>;

export const chicmozL2TxEffectDeluxeSchema = z.object({
  ...chicmozL2TxEffectSchema.shape,
  blockHeight: z.lazy(() => chicmozL2BlockSchema.shape.height),
  txBirthTimestamp: z.number(),
  timestamp: z.lazy(
    () =>
      chicmozL2BlockSchema.shape.header.shape.globalVariables.shape.timestamp
  ),
});

export type ChicmozL2TxEffectDeluxe = z.infer<
  typeof chicmozL2TxEffectDeluxeSchema
>;

export const chicmozL2BlockLightSchema = z.object({
  ...chicmozL2BlockSchema.shape,
  body: z.object({
    txEffects: z.array(chicmozL2TxEffectSchema.pick({ txHash: true })),
  }),
});

export type ChicmozL2BlockLight = z.infer<typeof chicmozL2BlockLightSchema>;

export const chicmozL2SequencerDeluxeSchema = z.object({
  ...chicmozL2SequencerSchema.shape,
  errors: z.array(chicmozL2RpcNodeErrorSchema),
});

export type ChicmozL2SequencerDeluxe = z.infer<
  typeof chicmozL2SequencerDeluxeSchema
>;
