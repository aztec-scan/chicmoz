export const REFETCH_INTERVAL = 1_000; // NOTE: delay for queries dependant on "latest" data
export const statsKey = "stats";

export const queryKeyGenerator = {
  txEffectsByBlockHeight: (height: string | number | bigint | undefined) => [
    "txEffectsByBlockHeight",
    Number(height),
  ],
  txEffectByHash: (hash: string) => ["txEffectByHash", hash],
  pendingTxs: ["pendingTxs"],
  latestBlock: ["latestBlock"],
  latestBlocks: ["latestBlocks"],
  blockByHeight: (height: string) => ["blockByHeight", height],
  totalTxEffects: [statsKey, "totalTxEffects"],
  totalTxEffectsLast24h: [statsKey, "totalTxEffectsLast24h"],
  totalContracts: [statsKey, "totalContracts"],
  totalContractsLast24h: [statsKey, "totalContractsLast24h"],
  averageFees: [statsKey, "averageFees"],
  averageBlockTime: [statsKey, "averageBlockTime"],
  contractClass: (classId?: string) => ["contractClass", classId],
  contractClassPrivateFunctions: (classId: string) => [
    "contractClassPrivateFunctions",
    classId,
  ],
  contractClassUnconstrainedFunctions: (classId: string) => [
    "contractClassUnconstrainedFunctions",
    classId,
  ],
  latestContractClasses: (classId?: string) => [
    "latestContractClasses",
    classId,
  ],
  contractInstance: (address: string) => ["contractInstance", address],
  latestContractInstances: ["latestContractInstances"],
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
};
