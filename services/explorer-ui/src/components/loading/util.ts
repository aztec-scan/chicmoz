import { formatTimeSince } from "~/lib/utils";

export const getEmptyTxEffectData = (hash?: string, date?: Date) => [
  {
    label: "HASH",
    value: hash,
  },
  {
    label: "CREATED AS PENDING TX",
    value: date ? `${formatTimeSince(date.getTime())} ago` : undefined,
  },
  {
    label: "TRANSACTION FEE (FJ)",
    value: undefined,
  },
  {
    label: "BLOCK NUMBER",
    value: undefined,
  },
  { label: "MINED ON CHAIN", value: undefined },
  {
    label: "RAW DATA",
    value: undefined,
  },
];
export const getEmptyBlockData = (hash?: string, timestamp?: number) => [
  {
    label: "Block Hash",
    value: hash,
  },
  {
    label: "Timestamp",
    value: timestamp ? `${formatTimeSince(timestamp)} ago` : undefined,
  },
  {
    label: "SlotNumber",
    value: undefined,
  },
  {
    label: "cointbase",
    value: undefined,
  },
  { label: "Number of Transactions", value: undefined },
  {
    label: "feeRecipient",
    value: undefined,
  },
  {
    label: "totalFees (FJ)",
    value: undefined,
  },
  {
    label: "feePerDaGas",
    value: undefined,
  },
  {
    label: "feePerL2Gas",
    value: undefined,
  },
  {
    label: "Block status",
    value: undefined,
  },
  {
    label: "Proposed on L1",
    value: undefined,
  },
  {
    label: "Proof Verified on L1",
    value: undefined,
  },
  {
    label: "Raw Data",
    value: undefined,
  },
];
export const getEmptyContractInstanceData = () => [
  {
    label: "ADDRESS",
    value: undefined,
  },
  {
    label: "CLASS ID",
    value: undefined,
  },
  {
    label: "BLOCK HASH",
    value: undefined,
  },
  { label: "VERSION", value: undefined },
  { label: "DEPLOYER", value: undefined },
  {
    label: "FEE JUICE BALANCE",
    value: undefined,
  },
  {
    label: "RAW DATA",
    value: undefined,
  },
];
