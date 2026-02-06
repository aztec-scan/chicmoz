import { z } from "zod";
import { aztecAddressSchema } from "../index.js";
import { l2NetworkIdSchema } from "../network-ids.js";

export const CHICMOZ_TYPES_AZTEC_VERSION = "3.0.0-devnet.20251212"; // TODO: this should be retreived dynamically

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
  enr: z.string().optional(),
  l1ContractAddresses: L1ContractAddressesSchema,
  protocolContractAddresses: ProtocolContractAddressesSchema,
});

export const chicmozL2RpcNodeSchema = z.object({
  name: z.string(),
  rpcUrl: z.string(),
  createdAt: z.coerce.date(),
  lastSeenAt: z.coerce.date().optional(),
});

export const chicmozL2RpcNodeErrorSchema = z.object({
  rpcNodeName: z.string().optional(),
  rpcUrl: chicmozL2RpcNodeSchema.shape.rpcUrl.optional(),
  nodeName: z.string().optional(),
  name: z.string(),
  cause: z.string(),
  message: z.string(),
  stack: z.string(),
  data: z.unknown(),
  count: z.number(),
  createdAt: z.coerce.date(),
  lastSeenAt: z.coerce.date(),
});

export const chicmozL2SequencerSchema = z.object({
  enr: z.string(),
  rpcNodeName: z.string().optional(),
  rpcUrl: z.string().optional(),
  l2NetworkId: l2NetworkIdSchema,
  rollupVersion: z.coerce.bigint().nonnegative(),
  nodeVersion: z.string(),
  l1ChainId: z.number(),
  lastSeenAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type ChicmozL2RpcNode = z.infer<typeof chicmozL2RpcNodeSchema>;
export type ChicmozL2RpcNodeError = z.infer<typeof chicmozL2RpcNodeErrorSchema>;
export type ChicmozL2Sequencer = z.infer<typeof chicmozL2SequencerSchema>;

export const chicmozContractInstanceBalanceSchema = z.object({
  contractAddress: aztecAddressSchema,
  balance: z.coerce.bigint().nonnegative(),
  timestamp: z.coerce.number().default(() => new Date().getTime()),
});

export type ChicmozContractInstanceBalance = z.infer<
  typeof chicmozContractInstanceBalanceSchema
>;
