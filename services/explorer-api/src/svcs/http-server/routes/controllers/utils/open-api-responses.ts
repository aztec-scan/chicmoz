import { generateSchema } from "@anatine/zod-openapi";
import {
  chicmozChainInfoSchema,
  chicmozContractInstanceBalanceSchema,
  chicmozFeeRecipientSchema,
  chicmozL1GenericContractEventSchema,
  chicmozL1L2ValidatorHistorySchema,
  chicmozValidatorWithSentinelSchema,
  chicmozL2BlockLightSchema,
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeployedEventSchema,
  chicmozL2ContractInstanceDeployerMetadataSchema,
  chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema,
  chicmozL2PendingTxSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2RpcNodeErrorSchema,
  chicmozL2SequencerDeluxeSchema,
  chicmozL2SequencerSchema,
  chicmozL2TxEffectDeluxeSchema,
  chicmozL2UtilityFunctionBroadcastedEventSchema,
  chicmozReorgSchema,
  chicmozSearchResultsSchema,
  slotStatusEnumSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { logger } from "../../../../../logger.js";

// TODO: this whole set-up should be done at runtime (start up)
// TODO: bigints should be handled better

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getResponse = (zodSchema: z.ZodType<any, any>, name?: string) => {
  let schema = {};
  // logger.info(`Generating schema for ${name}`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    schema = generateSchema(zodSchema);
    // logger.info(
    //   `Generated schema for ${name}: ${JSON.stringify(schema, null, 2)}`,
    // );
  } catch (e) {
    // NOTE: this catch never happens
    logger.error(
      `Failed to generate schema for ${name}: ${(e as Error).stack}`,
    );
  }

  return {
    "200": {
      description: "Successful response",
      content: {
        "application/json": {
          schema,
        },
      },
    },
  };
};

const cleanedBlockSchema = chicmozL2BlockLightSchema.extend({
  height: z.string(), // Convert height from BigInt to string
  header: chicmozL2BlockLightSchema.shape.header.extend({
    totalFees: z.string(),
    totalManaUsed: z.string(), // Convert manaUsed from BigInt to string
  }),
});
export const blockResponse = getResponse(cleanedBlockSchema, "block");
export const blockResponseArray = getResponse(
  z.array(cleanedBlockSchema),
  "blockArray",
);

// The feeRecipientResponseArray already has the correct fix
// with feesReceived converted to string:
export const feeRecipientResponseArray = getResponse(
  z.array(
    chicmozFeeRecipientSchema.extend({
      feesReceived: z.string(),
    }),
  ),
  "feeRecipientArray",
);

// Clean BigInt fields in TxEffectDeluxe schema
const cleanedTxEffectDeluxeSchema = chicmozL2TxEffectDeluxeSchema.extend({
  blockHeight: z.string(), // Convert BigInt to string
});

export const txEffectResponse = getResponse(
  cleanedTxEffectDeluxeSchema,
  "txEffect",
);
export const txEffectResponseArray = getResponse(
  z.array(cleanedTxEffectDeluxeSchema),
  "txEffectArray",
);

export const txResponse = getResponse(chicmozL2PendingTxSchema, "tx");
export const txResponseArray = getResponse(
  z.array(chicmozL2PendingTxSchema),
  "txArray",
);

export const contractClassResponse = getResponse(
  chicmozL2ContractClassRegisteredEventSchema,
  "contractClass",
);
export const contractClassResponseArray = getResponse(
  z.array(chicmozL2ContractClassRegisteredEventSchema),
  "contractClassArray",
);

export const contractClassPrivateFunctionResponse = getResponse(
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  "contractClassPrivateFunction",
);
export const contractClassPrivateFunctionResponseArray = getResponse(
  z.array(chicmozL2PrivateFunctionBroadcastedEventSchema),
  "contractClassPrivateFunctionArray",
);

export const contractClassUtilityFunctionResponse = getResponse(
  chicmozL2UtilityFunctionBroadcastedEventSchema,
  "contractClassUtilityFunction",
);
export const contractClassUtilityFunctionResponseArray = getResponse(
  z.array(chicmozL2UtilityFunctionBroadcastedEventSchema),
  "contractClassUtilityFunctionArray",
);

// For lazy schemas, we need to create a non-lazy version for OpenAPI generation
const cleanedContractInstanceDeluxeSchema = z.object({
  ...chicmozL2ContractInstanceDeployedEventSchema.shape,
  ...chicmozL2ContractClassRegisteredEventSchema.shape,
  blockHeight: z.string().optional(), // Convert BigInt to string
  isOrphaned: z.boolean(),
  deployerMetadata: chicmozL2ContractInstanceDeployerMetadataSchema.optional(),
  verifiedDeploymentArguments:
    chicmozL2ContractInstanceVerifiedDeploymentArgumentsSchema.optional(),
});

export const contractInstanceResponse = getResponse(
  cleanedContractInstanceDeluxeSchema,
  "contractInstance",
);
export const contractInstanceResponseArray = getResponse(
  z.array(cleanedContractInstanceDeluxeSchema),
  "contractInstanceArray",
);

export const contractInstanceBalanceResponse = getResponse(
  chicmozContractInstanceBalanceSchema,
  "contractInstanceBalance",
);

export const contractInstanceWithBalanceResponse = getResponse(
  chicmozContractInstanceBalanceSchema,
  "contractInstanceWithBalance",
);

export const contractInstanceBalanceHistoryResponse = getResponse(
  z.array(chicmozContractInstanceBalanceSchema),
  "contractInstanceBalanceHistory",
);

export const contractInstanceBalanceResponseArray = getResponse(
  z.array(chicmozContractInstanceBalanceSchema),
  "contractInstanceBalanceArray",
);

export const verifiedContractInstanceResponse = getResponse(
  chicmozL2ContractInstanceDeployerMetadataSchema,
  "verifiedContractInstance",
);
export const verifiedContractInstanceResponseArray = getResponse(
  z.array(chicmozL2ContractInstanceDeployerMetadataSchema),
  "verifiedContractInstanceArray",
);

export const searchResultResponse = getResponse(
  chicmozSearchResultsSchema,
  "searchResult",
);

const sentinelActivityForDocs = z.object({
  total: z.number(),
  missed: z.number(),
  lastSeenAt: z.number().optional(),
  lastSeenAtSlot: z.string().optional(),
});

const sentinelHistoryEntryForDocs = z.object({
  slot: z.string(),
  status: slotStatusEnumSchema,
});

const cleanedValidatorSchema = chicmozValidatorWithSentinelSchema.extend({
  stake: z.string(),
  lastSeenAtSlot: z.string().optional(),
  blocks: sentinelActivityForDocs.optional(),
  attestations: sentinelActivityForDocs.optional(),
  history: z.array(sentinelHistoryEntryForDocs).optional(),
});
export const l1L2ValidatorResponse = getResponse(
  cleanedValidatorSchema,
  "l1L2Validator",
);
export const l1L2ValidatorResponseArray = getResponse(
  z.array(cleanedValidatorSchema),
  "l1L2ValidatorArray",
);
export const l1L2ValidatorHistoryResponse = getResponse(
  chicmozL1L2ValidatorHistorySchema,
  "l1L2ValidatorHistory",
);

// Clean BigInt fields in Reorg schema
const cleanedReorgSchema = chicmozReorgSchema.extend({
  height: z.string(), // Convert height from BigInt to string
});
export const reorgResponse = getResponse(cleanedReorgSchema, "reorg");
export const reorgResponseArray = getResponse(
  z.array(cleanedReorgSchema),
  "reorgArray",
);

const cleanedSequencerDeluxeSchema = chicmozL2SequencerDeluxeSchema.extend({
  rollupVersion: z.string(), // Convert BigInt to string
});

export const sequencerResponse = getResponse(
  cleanedSequencerDeluxeSchema,
  "l2SequencerDeluxe",
);

const cleanedSequencerSchema = chicmozL2SequencerSchema.extend({
  rollupVersion: z.string(), // Convert BigInt to string
});

export const sequencerResponseArray = getResponse(
  z.array(cleanedSequencerSchema),
  "l2SequencerArrayDeluxe",
);

export const sequencerErrorResponseArray = getResponse(
  z.array(chicmozL2RpcNodeErrorSchema),
  "l2SequencerErrorArray",
);

const cleanedChainInfoSchema = chicmozChainInfoSchema.extend({
  rollupVersion: z.string(), // Convert BigInt to string
});

export const chainInfoResponse = getResponse(
  cleanedChainInfoSchema,
  "chainInfo",
);

export const chainErrorsResponse = sequencerErrorResponseArray;

const cleanedContractEventsSchema = chicmozL1GenericContractEventSchema.extend({
  l1BlockNumber: z.string(), // Convert BigInt to string
  l1BlockTimestamp: z.string(), // Convert Date to string
  eventArgs: z.record(z.unknown()).optional(),
});

export const contractEventsResponse = getResponse(
  cleanedContractEventsSchema,
  "contractEvents",
);
