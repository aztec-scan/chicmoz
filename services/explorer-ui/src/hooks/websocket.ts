import {
  chicmozL2BlockSchema,
  chicmozL2PendingTxSchema,
  chicmozL2TxEffectSchema,
  type ChicmozL2Block,
  type ChicmozL2BlockLight,
  type ChicmozL2PendingTx,
  type WebsocketUpdateMessageReceiver,
} from "@chicmoz-pkg/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { WS_URL } from "~/service/constants";
import { queryKeyGenerator, statsKey } from "./api/utils";

const updateBlock = (
  queryClient: ReturnType<typeof useQueryClient>,
  block: ChicmozL2BlockLight,
) => {
  queryClient.setQueryData(queryKeyGenerator.latestBlock, block);
  queryClient.setQueryData(
    queryKeyGenerator.latestBlocks,
    (oldData: ChicmozL2BlockLight[] | undefined) => {
      if (!oldData) {
        return [block];
      }
      if (oldData.find((b) => b.hash === block.hash)) {
        return oldData;
      }
      return [...oldData, block].sort((a, b) => Number(b.height - a.height));
    },
  );
};

const updateTxEffects = (
  queryClient: ReturnType<typeof useQueryClient>,
  block: ChicmozL2Block,
) => {
  const txEffects = block.body.txEffects.map((txEffect) => {
    const effect = chicmozL2TxEffectSchema.parse(txEffect);
    queryClient.setQueryData(queryKeyGenerator.txEffectByHash(effect.txHash), {
      ...effect,
      blockHeight: block.height,
      timestamp: block.header.globalVariables.timestamp,
    });
    return effect;
  });
  queryClient.setQueryData(
    queryKeyGenerator.txEffectsByBlockHeight(block.height),
    txEffects,
  );
};

const invalidateStats = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => queryClient.invalidateQueries({ queryKey: [statsKey], exact: false });

const invalidateContracts = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestContractClasses(),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeyGenerator.latestContractInstances,
    }),
  ]);
};

const handleBlock = async (
  queryClient: ReturnType<typeof useQueryClient>,
  blockData: ChicmozL2Block,
) => {
  const block = chicmozL2BlockSchema.parse(blockData);
  updateBlock(queryClient, block);
  updateTxEffects(queryClient, block);
  await Promise.all([
    invalidateStats(queryClient),
    invalidateContracts(queryClient),
  ]);
};

const updatePendingTxs = (
  queryClient: ReturnType<typeof useQueryClient>,
  txs: ChicmozL2PendingTx[],
) => {
  queryClient.setQueryData(
    queryKeyGenerator.pendingTxs,
    (oldData: ChicmozL2PendingTx[] | undefined) => {
      if (!oldData) {
        return txs;
      }
      return [...oldData, ...txs]
        .filter(
          (tx, index, self) =>
            self.findIndex((t) => t.hash === tx.hash) === index,
        )
        .sort((a, b) => b.birthTimestamp - a.birthTimestamp);
    },
  );
};

const handlePendingTxs = (
  queryClient: ReturnType<typeof useQueryClient>,
  txsData: ChicmozL2PendingTx[],
) => {
  const txs = z.array(chicmozL2PendingTxSchema).parse(txsData);
  updatePendingTxs(queryClient, txs);
};

const handleWebSocketMessage = async (
  queryClient: ReturnType<typeof useQueryClient>,
  data: string,
) => {
  const update: WebsocketUpdateMessageReceiver = JSON.parse(
    data,
  ) as WebsocketUpdateMessageReceiver;
  if (update.block) {
    await handleBlock(queryClient, update.block);
  }
  if (update.txs) {
    handlePendingTxs(queryClient, update.txs);
  }
};

export type WsReadyStateText = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

const wsReadyStateText = {
  0: "CONNECTING",
  1: "OPEN",
  2: "CLOSING",
  3: "CLOSED",
} as const;

type WsReadyState = typeof wsReadyStateText;

// Singleton WebSocket instance to prevent multiple connections
let websocketInstance: WebSocket | null = null;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

export const useWebSocketConnection = (): WsReadyStateText => {
  const queryClient = useQueryClient();
  const [readyState, setReadyState] = useState<keyof WsReadyState>(
    WebSocket.CONNECTING,
  );

  useEffect(() => {
    // Only create a new WebSocket if one doesn't exist or if it's in a CLOSED state
    if (
      !websocketInstance ||
      websocketInstance.readyState === WebSocket.CLOSED
    ) {
      if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
        console.log(
          `Maximum WebSocket connection attempts (${MAX_RETRY_ATTEMPTS}) reached, not retrying.`,
        );
        setReadyState(WebSocket.CLOSED);
        return;
      }

      connectionAttempts++;
      websocketInstance = new WebSocket(WS_URL);

      websocketInstance.onopen = () => {
        console.log("WebSocket Connected");
        connectionAttempts = 0; // Reset connection attempts on successful connection
        setReadyState(websocketInstance!.readyState as keyof WsReadyState);
      };

      websocketInstance.onmessage = async (event) => {
        setReadyState(websocketInstance!.readyState as keyof WsReadyState);
        if (typeof event.data !== "string") {
          console.error("WebSocket message is not a string");
        }
        try {
          await handleWebSocketMessage(queryClient, event.data as string);
        } catch (error) {
          console.error("Error handling WebSocket message", error);
        }
      };

      websocketInstance.onclose = () => {
        console.log("WebSocket Disconnected");
        setReadyState(websocketInstance!.readyState as keyof WsReadyState);
        websocketInstance = null; // Clear the reference when closed
      };
    } else {
      // Update readyState to match existing connection
      setReadyState(websocketInstance.readyState as keyof WsReadyState);
    }

    // Cleanup function - we only want to close the connection when the app unmounts,
    // not when the component using this hook unmounts
    return () => {
      // No need to close the WebSocket here as we're managing it globally
    };
  }, [queryClient]); // No dependencies to prevent recreating connections

  return wsReadyStateText[readyState];
};
