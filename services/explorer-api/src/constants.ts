import { AztecAddress, AztecScanNote, L2NetworkId } from "@chicmoz-pkg/types";

export const SERVICE_NAME = "explorer-api";

export const AZTEC_SCAN_NOTES: Record<
  L2NetworkId,
  Record<AztecAddress, AztecScanNote>
> = {
  MAINNET: {},
  SANDBOX: {
  },
  DEVNET: {},
  SP_TESTNET: {},
  PUBLIC_TESTNET: {},
};
