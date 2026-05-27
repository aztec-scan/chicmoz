/**
 * Polling tiers. We rely primarily on the websocket to invalidate relevant
 * caches (see `~/hooks/websocket`), so these intervals are safety-net polls,
 * not the main live-update path.
 */
export const LIVE_REFETCH_INTERVAL = 5_000; // tip, pending mempool
export const REFETCH_INTERVAL = 10_000; // "latest" tables and ticker feeds
export const SLOW_REFETCH_INTERVAL = 60_000; // lists that change slowly

/** Default staleTime applied by hooks that don't override it. */
export const DEFAULT_STALE_TIME = 10_000;
/** Long staleTime for aggregates (stats, chain-info, validators). */
export const LONG_STALE_TIME = 60_000;

export const statsKey = "stats";

export const queryKeyGenerator = {
  latestBlock: ["latestBlock"],
  latestBlocks: ["latestBlocks"],
  latestTableBlocks: ["latestTableBlocks"],
  latestTableBlocksByStatus: (status: string) => [
    "latestTableBlocks",
    "status",
    status,
  ],
  latestTableBlocksRange: (from: number, to: number) => [
    "latestTableBlocks",
    from,
    to,
  ],
  paginatedTableBlocks: (
    page: number,
    pageSize: number,
    status: string | undefined,
  ) => ["paginatedTableBlocks", page, pageSize, status],
  blockByHeight: (height: string) => ["blockByHeight", height],
  blockByRange: (min: number, max: number) => ["blockRange", min, max],
  blocksByNativeStatus: ["blocks", "by-native-status"],
  orphanedBlocks: ["blocks", "orphaned"],
  reorgs: ["reorgs"],
  l2TipsHealth: ["l2TipsHealth"],

  latestTxEffects: ["latestTxEffects"],
  latestTableTxEffects: ["latestTableTxEffects"],
  txEffectByHash: (hash: string) => ["txEffectByHash", hash],
  txEffectsByBlockHeight: (height: string | number | bigint | undefined) => [
    "txEffectsByBlockHeight",
    height?.toString(),
  ],

  pendingTxs: ["pendingTxs"],
  pendingTxsByHash: (hash: string) => ["pendingTxs", hash],
  droppedTxByHash: (hash: string) => ["droppedTxByHash", hash],

  publicCallRequestsByTxHash: (hash: string) => [
    "publicCallRequests",
    "tx",
    hash,
  ],
  publicCallRequestsByContract: (address: string) => [
    "publicCallRequests",
    "contract",
    address,
  ],
  publicCallRequestsBySender: (address: string) => [
    "publicCallRequests",
    "sender",
    address,
  ],

  l2ToL1MsgsByContract: (address: string) => [
    "l2ToL1Msgs",
    "contract",
    address,
  ],
  l2ToL1MsgsByRecipient: (address: string) => [
    "l2ToL1Msgs",
    "recipient",
    address,
  ],

  totalTxEffects: [statsKey, "totalTxEffects"],
  totalTxEffectsLast24h: [statsKey, "totalTxEffectsLast24h"],
  droppedTxsLast24h: [statsKey, "droppedTxsLast24h"],
  totalContracts: [statsKey, "totalContracts"],
  totalContractInstances: [statsKey, "totalContractInstances"],
  contractClassesSummary: [statsKey, "contractClassesSummary"],
  totalContractsLast24h: [statsKey, "totalContractsLast24h"],
  averageFees: [statsKey, "averageFees"],
  averageBlockTime: [statsKey, "averageBlockTime"],
  averageTxsPerBlock: [statsKey, "averageTxsPerBlock"],
  amountContractClassInstances: (classId: string) => [
    "amountOfInstances",
    classId,
  ],

  contractClass: ({
    classId,
    version,
    verifiedSourceOnly,
  }: {
    classId?: string;
    version?: string;
    verifiedSourceOnly?: boolean;
  }) => ["contractClass", classId, version, verifiedSourceOnly],
  contractClassPrivateFunctions: (classId: string) => [
    "contractClassPrivateFunctions",
    classId,
  ],
  contractClassUtilityFunctions: (classId: string) => [
    "contractClassUtilityFunctions",
    classId,
  ],
  latestContractClasses: ["latestContractClasses"],
  paginatedContractClasses: (offset: number, limit: number, filter: string) => [
    "latestContractClasses",
    offset,
    limit,
    filter,
  ],
  contractInstance: (address: string) => ["contractInstance", address],
  contractInstanceBalance: (address: string) => [
    "contractInstanceBalance",
    address,
  ],
  contractInstanceBalanceHistory: (address: string) => [
    "contractInstanceBalanceHistory",
    address,
  ],
  latestContractInstances: ["latestContractInstances"],
  contractInstancesWithAztecScanNotes: ["contractInstancesWithAztecScanNotes"],
  paginatedContractInstances: (
    offset: number,
    limit: number,
    filter: string,
  ) => ["latestContractInstances", offset, limit, filter],
  deployedContractInstances: (classId: string) => [
    "deployedContractInstances",
    classId,
  ],
  contractClassSource: (classId: string, version: string) => [
    "contractClassSource",
    classId,
    version,
  ],

  chainInfo: ["chainInfo"],
  rollupVersions: ["rollupVersions"],
  chainErrors: ["chainErrors"],
  feeRecipients: ["feeRecipients"],
  l1ContractEvents: ["l1ContractEvents"],
  l1ContractEventsHourlyCounts: (hours: number) => [
    "l1ContractEvents",
    "hourlyCounts",
    hours,
  ],
  rpcNodes: ["rpcNodes"],
  l1L2Validators: ["l1L2Validators"],
  l1L2ValidatorTotals: ["l1L2ValidatorTotals"],
  l1L2Validator: (address: string) => ["l1L2Validator", address],
  l1L2ValidatorHistory: (address: string) => ["l1L2ValidatorHistory", address],
  paginatedValidators: (page: number, pageSize: number) => [
    "l1",
    "l2-validators",
    "paginated",
    page,
    pageSize,
  ],

  search: (query: string) => ["search", query],

  // Governance
  governanceProposals: (params?: {
    state?: string;
    offset?: number;
    limit?: number;
  }) => ["governance", "proposals", params],
  governanceProposal: (proposalId: string) => [
    "governance",
    "proposal",
    proposalId,
  ],
  governanceProposalVotes: (
    proposalId: string,
    params?: { support?: boolean; offset?: number; limit?: number },
  ) => ["governance", "proposal", "votes", proposalId, params],
  governanceProposalSignals: (
    proposalId: string,
    params?: { offset?: number; limit?: number },
  ) => ["governance", "proposal", "signals", proposalId, params],
  governanceSignals: (params?: {
    payloadAddress?: string;
    round?: number;
    signaler?: string;
    offset?: number;
    limit?: number;
  }) => ["governance", "signals", params],
  governanceConfigurations: (params?: {
    offset?: number;
    limit?: number;
  }) => ["governance", "configurations", params],
  governanceProposerHistory: (params?: {
    offset?: number;
    limit?: number;
  }) => ["governance", "proposerHistory", params],
};
