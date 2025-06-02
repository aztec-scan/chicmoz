import { verifyInstanceDeploymentPayloadSchema } from "@chicmoz-pkg/contract-verification";
import {
  NODE_ENV,
  NodeEnv,
  chicmozL2BlockSchema,
  chicmozL2ContractInstanceDeployerMetadataSchema,
  chicmozL2SequencerSchema,
  chicmozSearchQuerySchema,
  ethAddressSchema,
  hexStringSchema,
} from "@chicmoz-pkg/types";
import { frSchema } from "@chicmoz-pkg/types/build/aztec/utils.js";
import { z } from "zod";
import { getContractJsonSchema } from "../../../standard-contracts.js";

export const heightOrHash = "heightOrHash";
export const blockHeight = "blockHeight";
export const blockHash = "blockHash";
export const txEffectIndex = "txEffectIndex";
export const txEffectHash = "txEffectHash";
export const address = "address";
export const contractClassId = "contractClassId";
export const version = "version";
export const functionSelector = "functionSelector";
export const artifactHash = "artifactHash";

export const paths = {
  latestHeight: "/l2/latest-height",
  latestBlock: "/l2/blocks/latest",
  block: `/l2/blocks/:${heightOrHash}`,
  blocks: "/l2/blocks",
  blocksByStatus: "/l2/blocks/by-status",
  orphanedBlocks: "/l2/blocks/orphaned",
  orphanedBlocksLimited: "/l2/blocks/orphans",
  reorgs: "/l2/reorgs",

  txEffects: "/l2/tx-effects",
  txEffectsByBlockHeight: `/l2/blocks/:${blockHeight}/tx-effects`,
  txEffectByBlockHeightAndIndex: `/l2/blocks/:${blockHeight}/tx-effects/:${txEffectIndex}`,
  txEffectsByTxEffectHash: `/l2/tx-effects/:${txEffectHash}`,

  txs: "/l2/txs",
  txByHash: `/l2/txs/:${txEffectHash}`,

  droppedTxByHash: `/l2/dropped-txs/:${txEffectHash}`,

  contractClass: `/l2/contract-classes/:${contractClassId}/versions/:${version}`,
  contractClassesByClassId: `/l2/contract-classes/:${contractClassId}`,
  contractClasses: `/l2/contract-classes`,
  contrctClassStandardArtifact: `/l2/contract-classes/:${contractClassId}/versions/:${version}/standard-artifact`,

  artifactsByArtifactHash: `/l2/artifacts/:${artifactHash}`,

  contractClassPrivateFunctions: `/l2/contract-classes/:${contractClassId}/private-functions`,
  contractClassPrivateFunction: `/l2/contract-classes/:${contractClassId}/private-functions/:${functionSelector}`,
  contractClassUtilityFunctions: `/l2/contract-classes/:${contractClassId}/utility-functions`,
  contractClassUtilityFunction: `/l2/contract-classes/:${contractClassId}/utility-functions/:${functionSelector}`,

  contractInstancesByContractClassId: `/l2/contract-classes/:${contractClassId}/contract-instances`,
  contractInstancesByBlockHash: `/l2/blocks/:${blockHash}/contract-instances`,
  contractInstancesWithAztecScanNotes:
    "/l2/contract-instances/with-aztec-scan-notes",
  contractInstance: `/l2/contract-instances/:${address}`,
  contractInstances: "/l2/contract-instances",

  search: "/l2/search",
  searchPublicLogs: "/l2/search/public-logs",

  feeRecipients: "/l2/fee-recipients",

  statsTotalTxEffects: "/l2/stats/total-tx-effects",
  statsTotalTxEffectsLast24h: "/l2/stats/tx-effects-last-24h",
  statsTotalContracts: "/l2/stats/total-contracts",
  statsTotalContractInstancesByContractClassId: `/l2/stats/total-contract-instances/:${contractClassId}`,
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

  uiBlockTable: "/l2/ui/blocks-for-table",
  uiTxEffectTable: "/l2/ui/tx-effects-for-table",
  uiTxEffectTableByBlockHeight: "/l2/ui/tx-effects-for-table/:blockHeight",
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
    [contractClassId]: hexStringSchema,
    [version]: z.coerce.number().nonnegative(),
  }),
  query: contractIncludeArtifactJson,
});

export const getContractClassIdSchema = z.object({
  params: z.object({
    [contractClassId]: hexStringSchema,
  }),
});
export const getContractClassesByCurrentClassIdSchema = z.object({
  params: z.object({
    [contractClassId]: hexStringSchema,
  }),
});

export const getArtifactsByArtifactHashSchema = z.object({
  params: z.object({
    [artifactHash]: hexStringSchema,
  }),
});

export const postContrctClassStandardArtifactSchema = z.object({
  params: getContractClassSchema.shape.params,
  body: getContractJsonSchema,
});

export const getContractClassPrivateFunctionsSchema = z.object({
  params: z.object({
    [contractClassId]: hexStringSchema,
  }),
});
export const getContractClassPrivateFunctionSchema = z.object({
  params: z.object({
    [contractClassId]: hexStringSchema,
    [functionSelector]: z.coerce.number().nonnegative(),
  }),
});

export const getContractClassUtilityFunctionsSchema =
  getContractClassPrivateFunctionsSchema;
export const getContractClassUtilityFunctionSchema =
  getContractClassPrivateFunctionSchema;

export const postContrctClassArtifactSchema = z.lazy(() => {
  return z.object({
    ...getContractClassSchema.shape,
    body: z.object({
      stringifiedArtifactJson: z.string(),
    }),
  });
});
export const getContractInstancesByCurrentContractClassIdSchema =
  getContractClassesByCurrentClassIdSchema;

export const getVerifiedContractInstanceSchema = getContractInstanceSchema;

export const postVerifiedContractInstanceSchema = z.lazy(() => {
  let overrideAztecOriginNotes = {};
  if (NODE_ENV === NodeEnv.PROD) {
    overrideAztecOriginNotes = {
      reviewedAt: true,
      aztecScanNotes: true,
    };
  }
  return z.object({
    ...getContractInstanceSchema.shape,
    body: z.object({
      deployerMetadata: chicmozL2ContractInstanceDeployerMetadataSchema
        .omit({
          address: true,
          uploadedAt: true,
          ...overrideAztecOriginNotes,
        })
        .optional(),
      verifiedDeploymentArguments: verifyInstanceDeploymentPayloadSchema,
    }),
  });
});

export const getSearchSchema = z.object({
  query: chicmozSearchQuerySchema,
});

export const getSearchPublicLogsSchema = z.object({
  query: z.object({
    frLogEntry: frSchema,
    index: z.coerce.number().int().nonnegative(),
  }),
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

export const getContractInstancesWithAztecScanNotesSchema = z.object({
  query: contractIncludeArtifactJson,
});
