export const REFETCH_INTERVAL = 1_000; // NOTE: delay for queries dependant on "latest" data
export const statsKey = "stats";

export const queryKeyGenerator = {
  txEffectsByBlockHeight: (height: string | number | bigint | undefined) => [
    "txEffectsByBlockHeight",
    Number(height),
  ],
  txEffectByHash: (hash: string) => ["txEffectByHash", hash],
  latestTxEffects: ["latestTxEffects"],
  pendingTxs: ["pendingTxs"],
  pendingTxsByHash: (hash: string) => ["pendingTxs", hash],
  droppedTxByHash: (hash: string) => ["droppedTxByHash", hash],
  latestBlock: ["latestBlock"],
  latestBlocks: ["latestBlocks"],
  latestTableBlocks: ["latestTableBlocks"],
  latestTableBlocksRange: (from: number, to: number) => [
    "latestTableBlocks",
    from,
    to,
  ],
  latestTableTxEffects: ["latestTableTxEffects"],
  latestTableTxEffectsRange: (from: number, to: number) => [
    "latestTableTxEffect",
    from,
    to,
  ],
  blockByHeight: (height: string) => ["blockByHeight", height],
  blockByRange: (min: number, max: number) => ["blockRange", min, max],
  totalTxEffects: [statsKey, "totalTxEffects"],
  totalTxEffectsLast24h: [statsKey, "totalTxEffectsLast24h"],
  totalContracts: [statsKey, "totalContracts"],
  totalContractsLast24h: [statsKey, "totalContractsLast24h"],
  averageFees: [statsKey, "averageFees"],
  averageBlockTime: [statsKey, "averageBlockTime"],
  contractClass: ({
    classId,
    version,
  }: {
    classId?: string;
    version?: string;
  }) => ["contractClass", classId, version],
  contractClassPrivateFunctions: (classId: string) => [
    "contractClassPrivateFunctions",
    classId,
  ],
  contractClassUtilityFunctions: (classId: string) => [
    "contractClassUtilityFunctions",
    classId,
  ],
  latestContractClasses: (classId?: string) => [
    "latestContractClasses",
    classId,
  ],
  contractInstance: (address: string) => ["contractInstance", address],
  contractInstanceBalance: (address: string) => ["contractInstanceBalance", address],
  contractInstanceBalanceHistory: (address: string) => ["contractInstanceBalanceHistory", address],
  latestContractInstances: ["latestContractInstances"],
  contractInstancesWithAztecScanNotes: ["contractInstancesWithAztecScanNotes"],
  contractInstancesWithBalance: ["contractInstancesWithBalance"],
  deployedContractInstances: (classId: string) => [
    "deployedContractInstances",
    classId,
  ],
  verifiedContracts: ["verifiedContracts"],
  verifiedContractByInstanceAddress: (address: string) => [
    "verifiedContractByInstanceAddress",
    address,
  ],
  chainInfo: ["chainInfo"],
  chainErrors: ["chainErrors"],
  sequencers: ["sequencers"],
  sequencer: (enr: string) => ["sequencer", enr],
  feeRecipients: ["feeRecipients"],
  l1L2Validators: ["l1L2Validators"],
  l1L2Validator: (address: string) => ["l1L2Validator", address],
  l1L2ValidatorHistory: (address: string) => ["l1L2ValidatorHistory", address],
  l1ContractEvents: ["l1ContractEvents"],
  amountContractClassInstances: (classId: string) => [
    "amountOfInstances",
    classId,
  ],
};
