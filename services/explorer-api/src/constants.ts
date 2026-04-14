import { AztecAddress, AztecScanNote, L2NetworkId } from "@chicmoz-pkg/types";

export const SERVICE_NAME = "explorer-api";

/* ⚠️ Aztec Scan Notes ⚠️
    Aztec Scan Notes are a way to add metadata to contracts on Aztec Scan. Preferably this should be done through the Aztec Scan UI, but for now we are adding them here manually.
    If you want to have your contract added here, please create a PR to this file.
*/
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
  TESTNET: {},
};

export const AZTEC_SCAN_MANUAL_SOURCE_CODE_URLS: Record<
  L2NetworkId,
  Record<AztecAddress, string>
> = {
  MAINNET: {},
  SANDBOX: {},
  TESTNET: {},
  DEVNET: {},
};
