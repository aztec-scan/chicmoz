import {
  type ChicmozL2DroppedTx,
  type ChicmozL2TxEffectDeluxe,
} from "@chicmoz-pkg/types";
import { API_URL, aztecExplorer } from "~/service/constants";
import { type TabId } from "./types";

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

export const getTxEffectData = (data: ChicmozL2TxEffectDeluxe) => {
  return [
    {
      label: "HASH",
      value: data.txHash,
    },
    {
      label: "TRANSACTION FEE (FJ)",
      value: data.transactionFee.toString(),
    },
    {
      label: "BLOCK NUMBER",
      value: data.blockHeight.toString(),
    },
    {
      label: "BLOCK HASH",
      value: data.blockHash,
      link: `/blocks/${data.blockHash}`,
    },
    {
      label: "MINED ON CHAIN",
      value: data.timestamp.toString(),
      timestamp: data.timestamp,
    },
    {
      label: "CREATED AS TRANSACTION",
      value: data.txBirthTimestamp
        ? data.txBirthTimestamp.toString()
        : "unknown",
      timestamp: data.txBirthTimestamp / 1000,
    },
    {
      label: "RAW DATA",
      value: "View raw data",
      extLink: `${API_URL}${aztecExplorer.getL2TxEffectByHash(data.txHash)}`,
    },
  ];
};

export const getDroppedTxEffectData = (data: ChicmozL2DroppedTx) => [
  {
    label: "TRANSACTION HASH",
    value: data.txHash,
  },
  {
    label: "DROPPED AT",
    value: new Date(data.droppedAt).toLocaleString(),
  },
  {
    label: "RAW DATA",
    value: "View raw data",
    extLink: `${API_URL}${aztecExplorer.getL2DroppedTxByHash(data.txHash)}`,
  },
];

export const mapTxEffectsData = (
  data?: ChicmozL2TxEffectDeluxe,
): Record<TabId, boolean> => {
  return {
    privateLogs: !!data?.privateLogs?.length,
    publicLogs: !!data?.publicLogs?.length,
    contractClassLogs: !!data?.contractClassLogs?.length,
    nullifiers: !!data?.nullifiers?.length,
    noteHashes: !!data?.noteHashes?.length,
    l2ToL1Msgs: !!data?.l2ToL1Msgs?.length,
    publicDataWrites: !!data?.publicDataWrites?.length,
  };
};
