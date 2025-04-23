import { AztecAddress, AztecScanNote, L2NetworkId } from "@chicmoz-pkg/types";

export const SERVICE_NAME = "explorer-api";

export const AZTEC_SCAN_NOTES: Record<
  L2NetworkId,
  Record<AztecAddress, AztecScanNote>
> = {
  MAINNET: {},
  SANDBOX: {
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": {
      name: "Example",
      origin: "This is an example note",
      comment: "EXAMPLE",
      relatedL1ContractAddresses: [
        {
          address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          note: "This is an example note for the L1-contract",
        },
      ],
    },
  },
  DEVNET: {},
  TESTNET: {
    "0x09db977a84f23f5294fd98a94f282bcaeefac30f5d3d546fd2413d8e7784b1ea": {
      name: "SHIPPED token",
      origin: "Aztec Team",
      comment:
        "This is one of the first contracts deployed testing the default token contract in Aztec-packages. The token is called 'SHIPPED'",
    },
    "0x1a0c0d3078abd18db8452c2443093984dd0ca42377da88896428bff50becaeff": {
      name: "nemi.fi PoolManager",
      origin: "Published in ecosystem Signal group pre public testnet launch",
      comment:
        "This is the PoolManager singleton contract for nemi.fi. It manages all liquidity pools and routes swaps.",
    },
  },
};
