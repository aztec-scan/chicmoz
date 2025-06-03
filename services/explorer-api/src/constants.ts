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
  TESTNET: {
    "0x0fb5144f2518c5501dfde73723cad1d1ac7f5a3ab15486ae4d444d228a205448": {
      name: "DAI test token",
      origin: "DeFi-wonderland",
      comment:
        "This is a test token deployed by DeFi-wonderland. It is a test token for the DAI token. It only has 9 decimals.",
    },
  },
};

export const AZTEC_SCAN_MANUAL_SOURCE_CODE_URLS: Record<
  L2NetworkId,
  Record<AztecAddress, string>
> = {
  MAINNET: {},
  SANDBOX: {},
  TESTNET: {
  //  "0x1848f4a84947391632f106de66335b649b8356b05f64feed80889d899ee82187":
  //    "https://github.com/defi-wonderland/aztec-standards/tree/9fcc5cabca6054053e54b1b48798e37b4bb0f685/src/token_contract",
  },
  DEVNET: {},
};
