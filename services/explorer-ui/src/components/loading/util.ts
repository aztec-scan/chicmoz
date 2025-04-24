import { formatTimeSince } from "~/lib/utils";

export const getEmptyTxEffectData = (hash?: string, timestamp?: number) => [
  {
    label: "HASH",
    value: hash,
  },
  {
    label: "CREATED AS PENDING TX",
    value: timestamp ? `${formatTimeSince(timestamp)} ago` : undefined,
  },
  {
    label: "TRANSACTION FEE (FPA)",
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
