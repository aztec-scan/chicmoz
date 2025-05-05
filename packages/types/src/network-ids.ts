import { z } from "zod";

export const l2NetworkIdSchema = z.enum([
  "MAINNET",
  "SANDBOX",
  "DEVNET",
  "TESTNET",
]);
export type L2NetworkId = z.infer<typeof l2NetworkIdSchema>;
export const l1NetworkIdSchema = z.enum([
  "ETH_MAINNET",
  "ANVIL_LOCAL",
  "ANVIL_DEVNET",
  "ETH_SEPOLIA",
]);
export type L1NetworkId = z.infer<typeof l1NetworkIdSchema>;

export const getL1NetworkId = (networkId: L2NetworkId): L1NetworkId => {
  switch (networkId) {
    case "MAINNET":
      return "ETH_MAINNET";
    case "SANDBOX":
      return "ANVIL_LOCAL";
    case "DEVNET":
      return "ANVIL_DEVNET";
    case "TESTNET":
      return "ETH_SEPOLIA";
  }
};
export const getL2NetworkId = (networkId: L1NetworkId): L2NetworkId => {
  switch (networkId) {
    case "ETH_MAINNET":
      return "MAINNET";
    case "ANVIL_LOCAL":
      return "SANDBOX";
    case "ANVIL_DEVNET":
      return "DEVNET";
    case "ETH_SEPOLIA":
      return "TESTNET";
  }
};
