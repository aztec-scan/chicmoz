import { AztecAddress, AztecScanNote, L2NetworkId } from "@chicmoz-pkg/types";

export const SERVICE_NAME = "explorer-api";

export const AZTEC_SCAN_NOTES: Record<
  L2NetworkId,
  Record<AztecAddress, AztecScanNote>
> = {
  MAINNET: {},
  SANDBOX: {
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": {
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
  TESTNET: {},
};
