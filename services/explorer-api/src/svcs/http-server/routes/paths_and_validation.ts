import { verifyInstanceDeploymentPayloadSchema } from "@chicmoz-pkg/contract-verification";
import {
  chicmozL2BlockSchema,
  chicmozL2ContractInstanceDeployerMetadataSchema,
  chicmozL2SequencerSchema,
  chicmozSearchQuerySchema,
  ethAddressSchema,
  hexStringSchema,
} from "@chicmoz-pkg/types";
import { z } from "zod";

export const heightOrHash = "heightOrHash";
export const blockHeight = "blockHeight";
export const blockHash = "blockHash";
export const txEffectIndex = "txEffectIndex";
export const txEffectHash = "txEffectHash";
export const address = "address";
export const classId = "classId";
export const version = "version";
export const functionSelector = "functionSelector";

export const paths = {
  latestHeight: "/l2/latest-height",
  latestBlock: "/l2/blocks/latest",
  block: `/l2/blocks/:${heightOrHash}`,
  blocks: "/l2/blocks",

  txEffects: "/l2/tx-effects",
  txEffectsByBlockHeight: `/l2/blocks/:${blockHeight}/tx-effects`,
  txEffectByBlockHeightAndIndex: `/l2/blocks/:${blockHeight}/tx-effects/:${txEffectIndex}`,
  txEffectsByTxEffectHash: `/l2/tx-effects/:${txEffectHash}`,

  txs: "/l2/txs",

  contractClass: `/l2/contract-classes/:${classId}/versions/:${version}`,
  contractClassesByClassId: `/l2/contract-classes/:${classId}`,
  contractClasses: `/l2/contract-classes`,

  contractClassPrivateFunctions: `/l2/contract-classes/:${classId}/private-functions`,
  contractClassPrivateFunction: `/l2/contract-classes/:${classId}/private-functions/:${functionSelector}`,
  contractClassUnconstrainedFunctions: `/l2/contract-classes/:${classId}/unconstrained-functions`,
  contractClassUnconstrainedFunction: `/l2/contract-classes/:${classId}/unconstrained-functions/:${functionSelector}`,

  contractInstancesByContractClassId: `/l2/contract-classes/:${classId}/contract-instances`,
  contractInstancesByBlockHash: `/l2/blocks/:${blockHash}/contract-instances`,
  contractInstance: `/l2/contract-instances/:${address}`,
  contractInstances: "/l2/contract-instances",

  search: "/l2/search",

  feeRecipients: "/l2/fee-recipients",

  statsTotalTxEffects: "/l2/stats/total-tx-effects",
  statsTotalTxEffectsLast24h: "/l2/stats/tx-effects-last-24h",
  statsTotalContracts: "/l2/stats/total-contracts",
  statsTotalContractsLast24h: "/l2/stats/total-contracts-last-24h",
  statsAverageFees: "/l2/stats/average-fees",
  statsAverageBlockTime: "/l2/stats/average-block-time",

  l1l2Validators: "/l1/l2-validators",
  l1l2Validator: "/l1/l2-validators/:attesterAddress",
  l1l2ValidatorHistory: "/l1/l2-validators/:attesterAddress/history",
  l1ContractEvents: "/l1/contract-events",

  chainInfo: "/l2/info",
  chainErrors: "/l2/errors",
  sequencers: "/l2/sequencers",
  sequencer: "/l2/sequencers/:enr",
};

export const getBlockByHeightOrHashSchema = z.object({
  params: z.object({
    [heightOrHash]: hexStringSchema.or(chicmozL2BlockSchema.shape.height),
  }),
});

export const getBlocksSchema = z.object({
  query: z.object({
    from: chicmozL2BlockSchema.shape.height.optional(),
    to: chicmozL2BlockSchema.shape.height.optional(),
  }),
});

export const getTxEffectsByBlockHeightSchema = z.object({
  params: z.object({
    [blockHeight]: chicmozL2BlockSchema.shape.height,
  }),
});

export const getTxEffectByBlockHeightAndIndexSchema = z.object({
  params: z.object({
    [blockHeight]: chicmozL2BlockSchema.shape.height,
    [txEffectIndex]: z.coerce.number().nonnegative(),
  }),
});

export const getTxEffectsByTxHashSchema = z.object({
  params: z.object({
    [txEffectHash]: hexStringSchema,
  }),
});

const contractIncludeArtifactJson = z.object({
  includeArtifactJson: z.coerce.boolean().optional(),
});

export const getContractInstanceSchema = z.object({
  params: z.object({
    [address]: hexStringSchema,
  }),
  query: contractIncludeArtifactJson,
});

export const getContractInstancesSchema = z.object({
  query: z.object({
    fromHeight: chicmozL2BlockSchema.shape.height.optional(),
    toHeight: chicmozL2BlockSchema.shape.height.optional(),
  }),
});

export const getContractInstancesByBlockHashSchema = z.object({
  params: z.object({
    [blockHash]: hexStringSchema,
  }),
  query: contractIncludeArtifactJson,
});

export const getContractClassSchema = z.object({
  params: z.object({
    [classId]: hexStringSchema,
    [version]: z.coerce.number().nonnegative(),
  }),
  query: contractIncludeArtifactJson,
});

export const getContractClassesByClassIdSchema = z.object({
  params: z.object({
    [classId]: hexStringSchema,
  }),
});

export const getContractClassPrivateFunctionsSchema = z.object({
  params: z.object({
    [classId]: hexStringSchema,
  }),
});
export const getContractClassPrivateFunctionSchema = z.object({
  params: z.object({
    [classId]: hexStringSchema,
    [functionSelector]: z.coerce.number().nonnegative(),
  }),
});
export const getContractClassUnconstrainedFunctionsSchema =
  getContractClassPrivateFunctionsSchema;
export const getContractClassUnconstrainedFunctionSchema =
  getContractClassPrivateFunctionSchema;

export const postContrctClassArtifactSchema = z.lazy(() => {
  return z.object({
    ...getContractClassSchema.shape,
    body: z.object({
      stringifiedArtifactJson: z.string(),
    }),
  });
});
export const getContractInstancesByContractClassIdSchema =
  getContractClassesByClassIdSchema;

export const getVerifiedContractInstanceSchema = getContractInstanceSchema;

export const postVerifiedContractInstanceSchema = z.lazy(() => {
  return z.object({
    ...getContractInstanceSchema.shape,
    body: z.object({
      deployerMetadata: chicmozL2ContractInstanceDeployerMetadataSchema
        .omit({
          address: true,
          uploadedAt: true,
        })
        .optional(),
      verifiedDeploymentArguments: verifyInstanceDeploymentPayloadSchema
    }),
  });
});

export const getSearchSchema = z.object({
  query: chicmozSearchQuerySchema,
});

export const getL1L2ValidatorSchema = z.object({
  params: z.object({
    attesterAddress: ethAddressSchema,
  }),
});

export const getSequencerSchema = z.object({
  params: z.object({
    enr: chicmozL2SequencerSchema.shape.enr,
  }),
});
