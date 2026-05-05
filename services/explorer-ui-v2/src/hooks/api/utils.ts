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
  latestTableBlocksRange: (from: number, to: number) => [
    "latestTableBlocks",
    from,
    to,
  ],
  paginatedTableBlocks: (page: number, pageSize: number) => [
    "paginatedTableBlocks",
    page,
    pageSize,
  ],
  blockByHeight: (height: string) => ["blockByHeight", height],
  blockByRange: (min: number, max: number) => ["blockRange", min, max],
  blocksByStatus: ["blocks", "by-status"],
  orphanedBlocks: ["blocks", "orphaned"],
  reorgs: ["reorgs"],

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
  chainErrors: ["chainErrors"],
  feeRecipients: ["feeRecipients"],
  l1ContractEvents: ["l1ContractEvents"],
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
};
