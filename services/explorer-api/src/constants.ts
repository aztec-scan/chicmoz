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
  DEVNET: {
  },
  TESTNET: {
    "0x23aa89a473816a75a38e5cbead8652fd047a0820657fd2b5ed97eba5b220a3ce": {
      name: "Bridged USDC",
      origin: "Raven House",
      comment: "Available at: https://bridge.ravenhouse.xyz",
      relatedL1ContractAddresses: [
        {
          address: "0x3c7E4990F18bd36029CC562B336022C657427c6A",
          note: "Bridge router address",
        },
        {
          address: "0xf98F4dd494833e0C686BA80454923D916C71CeC4",
          note: "Raven House mocked 'USDC'"
        },
        {
          address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
          note: "USDC"
        }
      ],
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
