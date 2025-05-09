import { apiKeySchema, l2NetworkIdSchema } from "@chicmoz-pkg/types";

export const aztecExplorer = {
  getL2LatestHeight: "l2/latest-height",
  getL2LatestBlock: "l2/blocks/latest",
  getL2BlockByHash: "l2/blocks/",
  getL2BlockByHeight: "l2/blocks/",
  getL2BlocksByHeightRange: "l2/blocks",
  getL2BlocksByStatus: "l2/blocks/by-status",
  getL2OrphanedBlocks: "l2/blocks/orphaned",
  getL2OrphanedBlocksLimited: "l2/blocks/orphans",
  getL2Reorgs: "l2/reorgs",
  getL2TxEffects: "l2/tx-effects",
  getL2TxEffectByHash: "l2/tx-effects/",
  getL2TxEffectsByHeight: (height: bigint) => `l2/blocks/${height}/tx-effects`,
  getL2TxEffectByHeightAndIndex: (height: bigint, index: number) =>
    `l2/blocks/${height}/txEffects/${index}`,
  getL2TxEffectsByHeightRange: "",
  getL2PendingTxs: "l2/txs",
  getL2PendingTxsByHash: (hash: string) => `l2/txs/${hash}`,
  getL2DroppedTxByHash: (hash: string) => `l2/dropped-txs/${hash}`,
  getL2ContractClassByIdAndVersion: (classId: string, version: string) =>
    `l2/contract-classes/${classId}/versions/${version}`,
  getL2ContractClasses: (classId?: string) =>
    classId ? `l2/contract-classes/${classId}` : "l2/contract-classes",
  getL2ContractClassPrivateFunctions: (
    classId: string,
    functionSelector?: string,
  ) =>
    functionSelector
      ? `l2/contract-classes/${classId}/private-functions/${functionSelector}`
      : `l2/contract-classes/${classId}/private-functions`,
  getL2ContractClassUtilityFunctions: (
    classId: string,
    functionSelector?: string,
  ) =>
    functionSelector
      ? `l2/contract-classes/${classId}/utility-functions/${functionSelector}`
      : `l2/contract-classes/${classId}/utility-functions`,
  getL2ContractInstance: (address: string) =>
    `l2/contract-instances/${address}`,
  getL2ContractInstances: "l2/contract-instances",
  getAmountContractClassInstances: (classId: string) =>
    `l2/stats/total-contract-instances/${classId}`,
  getL2ContractInstancesWithAztecScanNotes:
    "l2/contract-instances/with-aztec-scan-notes",
  getL2ContractInstancesByBlockHash: (hash: string) =>
    `l2/blocks/${hash}/contract-instances`,
  getL2ContractInstancesByClassId: (classId: string) =>
    `l2/contract-classes/${classId}/contract-instances`,
  getL2VerifiedContracts: "l2/verified-contracts",
  getL2VerifiedContractByInstanceAddress: (address: string) =>
    `l2/verified-contracts/${address}`,

  getL2TotalTxEffects: "l2/stats/total-tx-effects",
  getL2TotalTxEffectsLast24h: "/l2/stats/tx-effects-last-24h",
  getL2TotalContracts: "/l2/stats/total-contracts",
  getL2TotalContractsLast24h: "/l2/stats/total-contracts-last-24h",
  getL2AverageFees: "/l2/stats/average-fees",
  getL2AverageBlockTime: "/l2/stats/average-block-time",
  getL2SearchResult: "/l2/search",
  getL2ChainInfo: "/l2/info",
  getL2ChainErrors: "/l2/errors",
  getL2Sequencers: "/l2/sequencers",
  getL2Sequencer: (enr: string) => `l2/sequencers/${enr}`,
  getL2FeeRecipients: "/l2/fee-recipients",
  getL1GenericContractEvents: "/l1/contract-events",
  getL1L2Validators: `l1/l2-validators`,
  getL1L2Validator: (address: string) => `l1/l2-validators/${address}`,
  getL1L2ValidatorHistory: (address: string) =>
    `l1/l2-validators/${address}/history`,
  getTableBlocks: "/l2/ui/blocks-for-table",
  getTableTxEffects: "/l2/ui/tx-effects-for-table",
  getTableTxEffectsByHeight: (height: bigint) =>
    `l2/ui/tx-effect-for-table/${height}`,
};

export const APP_NAME = "Aztec-Scan";

export const L2_NETWORK_ID = l2NetworkIdSchema.parse(
  import.meta.env.VITE_L2_NETWORK_ID,
);

export const CHICMOZ_ALL_UI_URLS =
  typeof import.meta.env.VITE_CHICMOZ_ALL_UI_URLS === "string" &&
  import.meta.env.VITE_CHICMOZ_ALL_UI_URLS.length > 0
    ? import.meta.env.VITE_CHICMOZ_ALL_UI_URLS.split(",").map((tuple) => {
        const [name, url] = tuple.split("|");
        return { name, url };
      })
    : [];

const API_KEY = apiKeySchema.parse(import.meta.env.VITE_API_KEY);
export const API_URL =
  typeof import.meta.env.VITE_API_URL === "string"
    ? `${import.meta.env.VITE_API_URL}/${API_KEY}`
    : "";
export const WS_URL =
  typeof import.meta.env.VITE_WS_URL === "string"
    ? import.meta.env.VITE_WS_URL
    : "";
export const DISCORD_URL =
  typeof import.meta.env.VITE_DISCORD_URL === "string"
    ? import.meta.env.VITE_DISCORD_URL
    : "";
export const GITHUB_URL =
  typeof import.meta.env.VITE_GITHUB_URL === "string"
    ? import.meta.env.VITE_GITHUB_URL
    : "";

export const VERSION_STRING =
  typeof import.meta.env.VITE_VERSION_STRING === "string"
    ? import.meta.env.VITE_VERSION_STRING
    : "version undefined!";
