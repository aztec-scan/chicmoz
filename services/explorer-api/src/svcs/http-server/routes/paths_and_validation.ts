import { verifyInstanceDeploymentPayloadSchema } from "@chicmoz-pkg/contract-verification";
import {
  NODE_ENV,
  NodeEnv,
  chicmozL2BlockSchema,
  chicmozL2ContractInstanceDeployerMetadataSchema,
  chicmozL2RpcNodeSchema,
  chicmozSearchQuerySchema,
  contractStandardSchema,
  ethAddressSchema,
  hexStringSchema,
  uiBlockStatusFilterSchema,
} from "@chicmoz-pkg/types";
import { frSchema } from "@chicmoz-pkg/types/build/aztec/utils.js";
import { z } from "zod";

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
export const jobId = "jobId";

export const paths = {
  latestHeight: "/l2/latest-height",
  latestBlock: "/l2/blocks/latest",
  block: `/l2/blocks/:${heightOrHash}`,
  blocks: "/l2/blocks",
  blocksByNativeStatus: "/l2/blocks/by-status",
  orphanedBlocks: "/l2/blocks/orphaned",
  orphanedBlocksLimited: "/l2/blocks/orphans",
  reorgs: "/l2/reorgs",

  txEffects: "/l2/tx-effects",
  txEffectsByBlockHeight: `/l2/blocks/:${blockHeight}/tx-effects`,
  txEffectByBlockHeightAndIndex: `/l2/blocks/:${blockHeight}/tx-effects/:${txEffectIndex}`,
  txEffectsByTxEffectHash: `/l2/tx-effects/:${txEffectHash}`,

  txs: "/l2/txs",
  txByHash: `/l2/txs/:${txEffectHash}`,

  publicCallRequestsByTxHash: `/l2/public-call-requests/:${txEffectHash}`,
  publicCallRequests: "/l2/public-call-requests",

  l2ToL1MsgsByTx: `/l2/l2-to-l1-msgs/tx/:${txEffectHash}`,
  l2ToL1MsgsByContract: `/l2/l2-to-l1-msgs/contract/:${address}`,
  l2ToL1MsgsByRecipient: `/l2/l2-to-l1-msgs/recipient/:${address}`,

  droppedTxByHash: `/l2/dropped-txs/:${txEffectHash}`,

  contractClass: `/l2/contract-classes/:${contractClassId}/versions/:${version}`,
  contractClassesByClassId: `/l2/contract-classes/:${contractClassId}`,
  contractClasses: `/l2/contract-classes`,
  contrctClassStandardArtifact: `/l2/contract-classes/:${contractClassId}/versions/:${version}/standard-artifact`,

  verifySource: `/l2/contract-classes/:${contractClassId}/versions/:${version}/verify-source`,
  verifySourceJob: `/l2/contract-classes/:${contractClassId}/versions/:${version}/verify-source/:${jobId}`,
  contractClassSource: `/l2/contract-classes/:${contractClassId}/versions/:${version}/source`,

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
  contractInstanceBalance: `/l2/contract-instances/:${address}/balance`,
  contractInstanceBalanceHistory: `/l2/contract-instances/:${address}/balance/history`,
  contractInstancesWithBalance: "/l2/contract-instances/with-balance",
  contractInstances: "/l2/contract-instances",

  search: "/l2/search",
  searchPublicLogs: "/l2/search/public-logs",

  feeRecipients: "/l2/fee-recipients",

  statsTotalTxEffects: "/l2/stats/total-tx-effects",
  statsTotalTxEffectsLast24h: "/l2/stats/tx-effects-last-24h",
  statsDroppedTxsLast24h: "/l2/stats/dropped-txs-last-24h",
  statsTotalContracts: "/l2/stats/total-contracts",
  statsTotalContractInstances: "/l2/stats/total-contract-instances",
  statsTotalContractInstancesByContractClassId: `/l2/stats/total-contract-instances/:${contractClassId}`,
  statsTotalContractsLast24h: "/l2/stats/total-contracts-last-24h",
  statsContractClassesSummary: "/l2/stats/contract-classes-summary",
  statsAverageFees: "/l2/stats/average-fees",
  statsAverageBlockTime: "/l2/stats/average-block-time",
  statsAverageTxsPerBlock: "/l2/stats/average-txs-per-block",

  l1l2Validators: "/l1/l2-validators",
  l1l2ValidatorTotals: "/l1/l2-validators/totals",
  l1l2Validator: "/l1/l2-validators/:attesterAddress",
  l1l2ValidatorHistory: "/l1/l2-validators/:attesterAddress/history",
  l1ContractEvents: "/l1/contract-events",
  l1ContractEventsHourlyCounts: "/l1/contract-events/hourly-counts",

  // Governance
  governanceProposals: "/l1/governance/proposals",
  governanceProposal: "/l1/governance/proposals/:proposalId",
  governanceProposalVotes: "/l1/governance/proposals/:proposalId/votes",
  governanceProposalSignals: "/l1/governance/proposals/:proposalId/signals",
  governanceSignals: "/l1/governance/signals",
  governanceSignalsByRound: "/l1/governance/signals/round/:round",
  governanceSignalsByPayload: "/l1/governance/signals/payload/:payloadAddress",
  governanceConfigurations: "/l1/governance/configurations",
  governanceProposerHistory: "/l1/governance/proposer-history",

  chainInfo: "/l2/info",
  l2Tips: "/l2/tips",
  rollupVersions: "/l2/rollup-versions",
  chainErrors: "/l2/errors",
  rpcNodes: "/l2/rpc-nodes",
  rpcNode: "/l2/rpc-nodes/:rpcNodeName",

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

export const getUiBlocksSchema = z.object({
  query: z.object({
    from: chicmozL2BlockSchema.shape.height.optional(),
    to: chicmozL2BlockSchema.shape.height.optional(),
    status: uiBlockStatusFilterSchema.optional(),
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

export const getPublicCallRequestsSchema = z.object({
  query: z.object({
    contractAddress: hexStringSchema.optional(),
    senderAddress: hexStringSchema.optional(),
  }),
});

export const getL2ToL1MsgsByAddressSchema = z.object({
  params: z.object({
    [address]: hexStringSchema,
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
    offset: z.coerce.number().nonnegative().optional(),
    limit: z.coerce.number().positive().optional(),
    verified: z.coerce.boolean().optional(),
    protocol: z.coerce.boolean().optional(),
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

export const getContractClassesSchema = z.object({
  query: z.object({
    verifiedSourceOnly: z.coerce.boolean().optional(),
    offset: z.coerce.number().nonnegative().optional(),
    limit: z.coerce.number().positive().optional(),
    verified: z.coerce.boolean().optional(),
    protocol: z.coerce.boolean().optional(),
  }),
});

export const getArtifactsByArtifactHashSchema = z.object({
  params: z.object({
    [artifactHash]: hexStringSchema,
  }),
});

export const postContrctClassStandardArtifactSchema = z.object({
  params: getContractClassSchema.shape.params,
  body: contractStandardSchema,
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

export const getL1ContractEventsHourlyCountsSchema = z.object({
  query: z.object({
    // Window in hours. 24h default matches the L1 events sparkline; capped
    // at 168h (7d) to bound the result set and DB scan.
    hours: z.coerce.number().int().min(1).max(168).optional().default(24),
  }),
});

export const getL1L2ValidatorsPaginatedSchema = z.object({
  query: z.object({
    // Cap raised from 100 → 1000 so the UI can fetch the full validator set
    // in a single roundtrip for client-side filter/search/sort. Server-side
    // q/status filtering is the longer-term fix; until then a higher cap
    // avoids the page-through-100s-at-a-time loop in useL1L2Validators.
    limit: z.coerce.number().min(1).max(1000).optional().default(20),
    offset: z.coerce.number().min(0).optional().default(0),
  }),
});

export const getRpcNodeSchema = z.object({
  params: z.object({
    rpcNodeName: chicmozL2RpcNodeSchema.shape.rpcNodeName,
  }),
});

export const getContractInstanceBalanceSchema = z.object({
  params: getContractInstanceSchema.shape.params,
});

export const getContractInstancesWithAztecScanNotesSchema = z.object({
  query: contractIncludeArtifactJson,
});

export const postVerifySourceSchema = z.object({
  params: z.object({
    [contractClassId]: hexStringSchema,
    [version]: z.coerce.number().nonnegative(),
  }),
  body: z.object({
    githubUrl: z.string().url(),
    gitRef: z.string().optional(),
    subPath: z.string().optional(),
  }),
});

export const getVerifySourceJobSchema = z.object({
  params: z.object({
    [contractClassId]: hexStringSchema,
    [version]: z.coerce.number().nonnegative(),
    [jobId]: z.string().uuid(),
  }),
});

export const getContractClassSourceSchema = z.object({
  params: z.object({
    [contractClassId]: hexStringSchema,
    [version]: z.coerce.number().nonnegative(),
  }),
});

// ── Governance validation schemas ────────────────────────────────────────────

export const getGovernanceProposalsSchema = z.object({
  query: z.object({
    state: z.string().optional(),
    from: z.coerce.number().optional(),
    to: z.coerce.number().optional(),
    offset: z.coerce.number().nonnegative().optional().default(0),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
  }),
});

export const getGovernanceProposalSchema = z.object({
  params: z.object({
    proposalId: z.string(),
  }),
});

export const getGovernanceProposalVotesSchema = z.object({
  params: z.object({
    proposalId: z.string(),
  }),
  query: z.object({
    support: z.coerce.boolean().optional(),
    offset: z.coerce.number().nonnegative().optional().default(0),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
  }),
});

export const getGovernanceProposalSignalsSchema = z.object({
  params: z.object({
    proposalId: z.string(),
  }),
  query: z.object({
    offset: z.coerce.number().nonnegative().optional().default(0),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
  }),
});

export const getGovernanceSignalsSchema = z.object({
  query: z.object({
    payloadAddress: ethAddressSchema.optional(),
    round: z.coerce.bigint().optional(),
    signaler: ethAddressSchema.optional(),
    offset: z.coerce.number().nonnegative().optional().default(0),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
  }),
});

export const getGovernanceSignalsByRoundSchema = z.object({
  params: z.object({
    round: z.coerce.bigint(),
  }),
});

export const getGovernanceSignalsByPayloadSchema = z.object({
  params: z.object({
    payloadAddress: ethAddressSchema,
  }),
});

export const getGovernanceConfigurationsSchema = z.object({
  query: z.object({
    offset: z.coerce.number().nonnegative().optional().default(0),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
  }),
});

export const getGovernanceProposerHistorySchema = z.object({
  query: z.object({
    offset: z.coerce.number().nonnegative().optional().default(0),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
  }),
});
