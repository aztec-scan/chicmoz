import { generateSchema } from "@anatine/zod-openapi";
import {
  chicmozChainInfoSchema,
  chicmozFeeRecipientSchema,
  chicmozL1GenericContractEventSchema,
  chicmozL1L2ValidatorHistorySchema,
  chicmozL1L2ValidatorSchema,
  chicmozL2BlockLightSchema,
  chicmozL2ContractClassRegisteredEventSchema,
  chicmozL2ContractInstanceDeluxeSchema,
  chicmozL2ContractInstanceDeployerMetadataSchema,
  chicmozL2PendingTxSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2RpcNodeErrorSchema,
  chicmozL2SequencerDeluxeSchema,
  chicmozL2SequencerSchema,
  chicmozL2TxEffectDeluxeSchema,
  chicmozL2UnconstrainedFunctionBroadcastedEventSchema,
  chicmozSearchResultsSchema,
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
    //logger.info(`Generated schema for ${name}: ${JSON.stringify(schema, null, 2)}`);
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

export const contractClassUnconstrainedFunctionResponse = getResponse(
  chicmozL2UnconstrainedFunctionBroadcastedEventSchema,
  "contractClassUnconstrainedFunction",
);
export const contractClassUnconstrainedFunctionResponseArray = getResponse(
  z.array(chicmozL2UnconstrainedFunctionBroadcastedEventSchema),
  "contractClassUnconstrainedFunctionArray",
);

// For lazy schemas, we need to create a modified version differently
// We'll use a transform to convert BigInt to string at runtime
const cleanedContractInstanceDeluxeSchema = z.lazy(() => {
  // Start with the original schema
  return chicmozL2ContractInstanceDeluxeSchema.transform((data) => {
    // Create a new object with all the original properties
    const result = { ...data };

    // Convert the blockHeight to string if it exists
    if (result.blockHeight !== undefined) {
      result.blockHeight = result.blockHeight.toString() as unknown as bigint;
    }

    return result;
  });
});

export const contractInstanceResponse = getResponse(
  cleanedContractInstanceDeluxeSchema,
  "contractInstance",
);
export const contractInstanceResponseArray = getResponse(
  z.array(cleanedContractInstanceDeluxeSchema),
  "contractInstanceArray",
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

const cleanedValidatorSchema = chicmozL1L2ValidatorSchema.extend({
  stake: z.string(),
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

export const sequencerResponse = getResponse(
  chicmozL2SequencerDeluxeSchema,
  "l2Sequencer",
);
export const sequencerResponseArray = getResponse(
  z.array(chicmozL2SequencerSchema),
  "l2SequencerArray",
);
export const sequencerErrorResponseArray = getResponse(
  z.array(chicmozL2RpcNodeErrorSchema),
  "l2SequencerErrorArray",
);

export const chainInfoResponse = getResponse(
  chicmozChainInfoSchema,
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
