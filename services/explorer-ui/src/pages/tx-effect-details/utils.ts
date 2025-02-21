import { type ChicmozL2TxEffectDeluxe } from "@chicmoz-pkg/types";
import { formatTimeSince } from "~/lib/utils";
import { API_URL, aztecExplorer } from "~/service/constants";
import { TabId } from "./types";

export type TxEffectDataType =
  | string[][]
  | string[]
  | Array<{ logs: Array<{ data: Buffer; contractAddress: string }> }>
  | Array<{
    logs: Array<{
      data: Buffer;
      maskedContractAddress: string;
    }>;
  }>
  | Array<{ logs: Array<{ data: Buffer }> }>
  | Array<{ leafSlot: string; value: string }>;

export const naiveDecode = (data: string[]): string => {
  let counterZero = 0;
  let counterAbove128 = 0;
  const charCodes: number[] = data
    ?.map((hex) => parseInt(hex, 16))
    .map((charCode) => {
      if (charCode === 0) counterZero++;
      if (charCode > 128) counterAbove128++;
      return charCode;
    });
  const isNoWeirdChars = counterZero + counterAbove128 === 0;
  const isProbablyAReadableString =
    isNoWeirdChars || data.length - charCodes.indexOf(0) === counterZero;
  const res = charCodes.map((char) => String.fromCharCode(char)).join("");
  return isProbablyAReadableString ? res : data.join("\n");
};

export const getTxEffectData = (data: ChicmozL2TxEffectDeluxe) => [
  {
    label: "HASH",
    value: data.txHash,
  },
  {
    label: "TRANSACTION FEE (FPA)",
    value: data.transactionFee.toString(),
  },
  {
    label: "BLOCK NUMBER",
    value: data.blockHeight.toString(),
    link: `/blocks/${data.blockHeight}`,
  },
  { label: "MINED ON CHAIN", value: formatTimeSince(data.timestamp) },
  {
    label: "CREATED AS TRANSACTION",
    value: formatTimeSince(data.txBirthTimestamp),
  },
  {
    label: "RAW DATA",
    value: "View raw data",
    extLink: `${API_URL}/${aztecExplorer.getL2TxEffectByHash}${data.txHash}`,
  },
];

export const mapTxEffectsData = (
  data?: ChicmozL2TxEffectDeluxe
): Record<TabId, boolean> => {
  return {
    privateLogs: !!data?.privateLogs?.length,
    publicLogs: !!data?.publicLogs?.length,
    nullifiers: !!data?.nullifiers?.length,
    noteHashes: !!data?.noteHashes?.length,
    l2ToL1Msgs: !!data?.l2ToL1Msgs?.length,
    publicDataWrites: !!data?.publicDataWrites?.length,
  };
};
