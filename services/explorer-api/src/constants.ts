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
  TESTNET: {
    "0x2bea21f97158ddc1b3494a81d5a6f32a37894b8ea7c8d76bac65c16a2ae99dc0": {
      origin: "Random contract instance 1",
      comment:
        "This is a randomly taken address that is deployed by 0x0000...0000 on testnet. It is for testing purposes only.",
    },
    "0x2be4b0af7c0494e5855639ad45eeb051543facd9b989be9b016b6ca1a2879709": {
      origin: "Random contract instance 2",
      comment:
        "This is a randomly taken address that is deployed by 0x0000...0000 on testnet. It is for testing purposes only.",
    },
    "0x0ade7d13b212fe033957f133d0651f0bd589461322e818e5da90a6eb83db576c": {
      origin: "Random contract instance 3",
      comment:
        "This is a randomly taken address that is deployed by 0x0000...0000 on testnet. It is for testing purposes only.",
    },
    "0x05a6c000163e604b80dcdace23fd84913e746d8e0739c49f70a2f00a2c020bb4": {
      origin: "Random contract instance 4",
      comment:
        "This is a randomly taken address that is deployed by 0x0000...0000 on testnet. It is for testing purposes only.",
    },
    "0x022ced081a1d6083a74d3c016c9d340729b3e63e727e8d673339f555dd1fee34": {
      origin: "Random contract instance 5",
      comment:
        "This is a randomly taken address that is deployed by 0x0000...0000 on testnet. It is for testing purposes only.",
    },
  },
};
