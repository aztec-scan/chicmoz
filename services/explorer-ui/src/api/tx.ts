import {
  chicmozL2PendingTxSchema,
  publicCallRequestSchema,
  pendingL2ToL1MsgSchema,
  type ChicmozL2PendingTx,
  type PublicCallRequest,
  type ChicmozL2PendingL2ToL1Msg,
} from "@chicmoz-pkg/types";
import { z } from "zod";
import { aztecExplorer } from "~/service/constants";
import client, { validateResponse } from "./client";

export const TxAPI = {
  getPendingTxs: async (): Promise<ChicmozL2PendingTx[]> => {
    const response = await client.get(aztecExplorer.getL2PendingTxs);
    return validateResponse(z.array(chicmozL2PendingTxSchema), response.data);
  },
  getPendingTxsByHash: async (hash: string): Promise<ChicmozL2PendingTx> => {
    const response = await client.get(
      aztecExplorer.getL2PendingTxsByHash(hash),
    );
    return validateResponse(chicmozL2PendingTxSchema, response.data);
  },
  getPublicCallRequestsByContract: async (
    address: string,
  ): Promise<PublicCallRequest[]> => {
    const response = await client.get(
      aztecExplorer.getL2PublicCallRequestsByContract(address),
    );
    return validateResponse(z.array(publicCallRequestSchema), response.data);
  },
  getL2ToL1MsgsByContract: async (
    address: string,
  ): Promise<ChicmozL2PendingL2ToL1Msg[]> => {
    const response = await client.get(
      aztecExplorer.getL2ToL1MsgsByContract(address),
    );
    return validateResponse(z.array(pendingL2ToL1MsgSchema), response.data);
  },
  getPublicCallRequestsBySender: async (
    address: string,
  ): Promise<PublicCallRequest[]> => {
    const response = await client.get(
      aztecExplorer.getL2PublicCallRequestsBySender(address),
    );
    return validateResponse(z.array(publicCallRequestSchema), response.data);
  },
  getPublicCallRequestsByTxHash: async (
    txHash: string,
  ): Promise<PublicCallRequest[]> => {
    const response = await client.get(
      aztecExplorer.getL2PublicCallRequestsByTxHash(txHash),
    );
    return validateResponse(z.array(publicCallRequestSchema), response.data);
  },
  getL2ToL1MsgsByRecipient: async (
    address: string,
  ): Promise<ChicmozL2PendingL2ToL1Msg[]> => {
    const response = await client.get(
      aztecExplorer.getL2ToL1MsgsByRecipient(address),
    );
    return validateResponse(z.array(pendingL2ToL1MsgSchema), response.data);
  },
};
