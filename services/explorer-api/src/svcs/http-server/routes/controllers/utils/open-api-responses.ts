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
  chicmozL2PendingTxSchema,
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  chicmozL2RpcNodeErrorSchema,
  chicmozL2SequencerDeluxeSchema,
  chicmozL2SequencerSchema,
  chicmozL2TxEffectDeluxeSchema,
  chicmozL2UnconstrainedFunctionBroadcastedEventSchema,
  chicmozL2ContractInstanceDeployerMetadataSchema,
  chicmozSearchResultsSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { logger } from "../../../../../logger.js";

// TODO: this whole set-up should be done at runtime (start up)
// TODO: bigints should be handled better

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getResponse = (zodSchema: z.ZodType<any, any>, name?: string) => {
  let schema = {};
  //logger.info(`Generating schema for ${name}`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    schema = generateSchema(zodSchema);
    //logger.info(`Generated schema for ${name}: ${JSON.stringify(schema, null, 2)}`);
  } catch (e) {
    // NOTE: this catch never happens
    logger.error(
      `Failed to generate schema for ${name}: ${(e as Error).stack}`
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
  header: chicmozL2BlockLightSchema.shape.header.extend({
    totalFees: z.string(),
  }),
});
export const blockResponse = getResponse(cleanedBlockSchema, "block");
export const blockResponseArray = getResponse(
  z.array(cleanedBlockSchema),
  "blockArray"
);

export const feeRecipientResponseArray = getResponse(
  z.array(
    chicmozFeeRecipientSchema.extend({
      feesReceived: z.string(),
    })
  ),
  "feeRecipientArray"
);

export const txEffectResponse = getResponse(
  chicmozL2TxEffectDeluxeSchema,
  "txEffect"
);
export const txEffectResponseArray = getResponse(
  z.array(chicmozL2TxEffectDeluxeSchema),
  "txEffectArray"
);

export const txResponse = getResponse(chicmozL2PendingTxSchema, "tx");
export const txResponseArray = getResponse(
  z.array(chicmozL2PendingTxSchema),
  "txArray"
);

export const contractClassResponse = getResponse(
  chicmozL2ContractClassRegisteredEventSchema,
  "contractClass"
);
export const contractClassResponseArray = getResponse(
  z.array(chicmozL2ContractClassRegisteredEventSchema),
  "contractClassArray"
);

export const contractClassPrivateFunctionResponse = getResponse(
  chicmozL2PrivateFunctionBroadcastedEventSchema,
  "contractClassPrivateFunction"
);
export const contractClassPrivateFunctionResponseArray = getResponse(
  z.array(chicmozL2PrivateFunctionBroadcastedEventSchema),
  "contractClassPrivateFunctionArray"
);

export const contractClassUnconstrainedFunctionResponse = getResponse(
  chicmozL2UnconstrainedFunctionBroadcastedEventSchema,
  "contractClassUnconstrainedFunction"
);
export const contractClassUnconstrainedFunctionResponseArray = getResponse(
  z.array(chicmozL2UnconstrainedFunctionBroadcastedEventSchema),
  "contractClassUnconstrainedFunctionArray"
);

export const contractInstanceResponse = getResponse(
  chicmozL2ContractInstanceDeluxeSchema,
  "contractInstance"
);
export const contractInstanceResponseArray = getResponse(
  z.array(chicmozL2ContractInstanceDeluxeSchema),
  "contractInstanceArray"
);

export const verifiedContractInstanceResponse = getResponse(
  chicmozL2ContractInstanceDeployerMetadataSchema,
  "verifiedContractInstance"
);
export const verifiedContractInstanceResponseArray = getResponse(
  z.array(chicmozL2ContractInstanceDeployerMetadataSchema),
  "verifiedContractInstanceArray"
);

export const searchResultResponse = getResponse(
  chicmozSearchResultsSchema,
  "searchResult"
);

const cleanedValidatorSchema = chicmozL1L2ValidatorSchema.extend({
  stake: z.string(),
});
export const l1L2ValidatorResponse = getResponse(
  cleanedValidatorSchema,
  "l1L2Validator"
);
export const l1L2ValidatorResponseArray = getResponse(
  z.array(cleanedValidatorSchema),
  "l1L2ValidatorArray"
);
export const l1L2ValidatorHistoryResponse = getResponse(
  chicmozL1L2ValidatorHistorySchema,
  "l1L2ValidatorHistory"
);

export const sequencerResponse = getResponse(
  chicmozL2SequencerDeluxeSchema,
  "l2Sequencer"
);
export const sequencerResponseArray = getResponse(
  z.array(chicmozL2SequencerSchema),
  "l2SequencerArray"
);
export const sequencerErrorResponseArray = getResponse(
  z.array(chicmozL2RpcNodeErrorSchema),
  "l2SequencerErrorArray"
);

export const chainInfoResponse = getResponse(
  chicmozChainInfoSchema,
  "chainInfo"
);
export const chainErrorsResponse = sequencerErrorResponseArray;

export const contractEventsResponse = getResponse(
  z.array(chicmozL1GenericContractEventSchema),
  "contractEvents"
);
