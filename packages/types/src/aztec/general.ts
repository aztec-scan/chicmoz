import { z } from "zod";
import { aztecAddressSchema, hexStringSchema } from "../general.js";
import { l2NetworkIdSchema } from "../network-ids.js";

export const L1ContractAddressesSchema = z.object({
  rollupAddress: z.string().startsWith("0x"),
  registryAddress: z.string().startsWith("0x"),
  inboxAddress: z.string().startsWith("0x"),
  outboxAddress: z.string().startsWith("0x"),
  feeJuiceAddress: z.string().startsWith("0x"),
  feeJuicePortalAddress: z.string().startsWith("0x"),
  coinIssuerAddress: z.string().startsWith("0x"),
  rewardDistributorAddress: z.string().startsWith("0x"),
  governanceProposerAddress: z.string().startsWith("0x"),
  governanceAddress: z.string().startsWith("0x"),
  stakingAssetAddress: z.string().startsWith("0x"),
});

export const ProtocolContractAddressesSchema = z.object({
  classRegistry: z.string().startsWith("0x"),
  feeJuice: z.string().startsWith("0x"),
  instanceRegistry: z.string().startsWith("0x"),
  multiCallEntrypoint: z.string().startsWith("0x"),
});

export const chicmozChainInfoSchema = z.object({
  l2NetworkId: l2NetworkIdSchema,
  l1ChainId: z.number(),
  rollupVersion: z.coerce.bigint().nonnegative(),
  l1ContractAddresses: L1ContractAddressesSchema,
  protocolContractAddresses: ProtocolContractAddressesSchema,
  stakingAssetSymbol: z.string().optional(),
  stakingAssetDecimals: z.number().int().nonnegative().optional(),
  feeJuiceSymbol: z.string().optional(),
  feeJuiceDecimals: z.number().int().nonnegative().optional(),
  createdAt: z.coerce.date().optional(),
  latestUpdateAt: z.coerce.date().optional(),
});

export type L1ContractAddresses = z.infer<typeof L1ContractAddressesSchema>;
export type ProtocolContractAddresses = z.infer<
  typeof ProtocolContractAddressesSchema
>;
export type ChicmozChainInfo = z.infer<typeof chicmozChainInfoSchema>;

export const nodeInfoSchema = z.object({
  nodeVersion: z.string(),
  l1ChainId: z.number(),
  rollupVersion: z.coerce.bigint().nonnegative(),
  l1ContractAddresses: L1ContractAddressesSchema,
  protocolContractAddresses: ProtocolContractAddressesSchema,
});

export const chicmozL2RpcNodeSchema = z.object({
  rpcNodeName: z.string(),
  rpcUrl: z.string(),
  l2NetworkId: l2NetworkIdSchema,
  rollupVersion: z.coerce.bigint().nonnegative(),
  nodeVersion: z.string(),
  l1ChainId: z.number(),
  createdAt: z.coerce.date(),
  lastSeenAt: z.coerce.date(),
});

export const publicChicmozL2RpcNodeSchema = chicmozL2RpcNodeSchema.omit({
  rpcUrl: true,
});

export const chicmozL2RpcNodeErrorSchema = z.object({
  rpcNodeName: chicmozL2RpcNodeSchema.shape.rpcNodeName,
  rpcUrl: chicmozL2RpcNodeSchema.shape.rpcUrl.optional(),
  name: z.string(),
  cause: z.string(),
  message: z.string(),
  stack: z.string(),
  data: z.unknown(),
  count: z.number(),
  createdAt: z.coerce.date(),
  lastSeenAt: z.coerce.date(),
});

// Deprecated compatibility alias. Use chicmozL2RpcNodeSchema instead.
export const chicmozL2SequencerSchema = chicmozL2RpcNodeSchema.extend({
  enr: z.string().optional(),
});

export type ChicmozL2RpcNode = z.infer<typeof chicmozL2RpcNodeSchema>;
export type PublicChicmozL2RpcNode = z.infer<
  typeof publicChicmozL2RpcNodeSchema
>;
export type ChicmozL2RpcNodeError = z.infer<typeof chicmozL2RpcNodeErrorSchema>;
export type ChicmozL2Sequencer = z.infer<typeof chicmozL2SequencerSchema>;

export const chicmozContractInstanceBalanceSchema = z.object({
  contractAddress: aztecAddressSchema,
  balance: z.coerce.bigint().nonnegative(),
  timestamp: z.coerce.number().default(() => new Date().getTime()),
  // Hash of the L2 tx whose execution caused this balance change. Optional
  // because older history entries (pre-migration) won't carry it.
  sourceTxHash: hexStringSchema.optional(),
  // L2 address that received the fee for the block containing this balance change.
  feeRecipient: aztecAddressSchema.nullish(),
  // L2 block number at which this balance was snapshotted.
  blockNumber: z.coerce.bigint().optional(),
});

export type ChicmozContractInstanceBalance = z.infer<
  typeof chicmozContractInstanceBalanceSchema
>;
