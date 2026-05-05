import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTabVisibility } from "~/hooks/useTabVisibility";
import { WS_URL } from "~/service/constants";
import { handleWebSocketMessage } from "./message-callbacks";

export type WsReadyStateText =
  | "CONNECTING"
  | "OPEN"
  | "CLOSING"
  | "CLOSED"
  | "TAB_INACTIVE"
  | "RECONNECTING";

const wsReadyStateText = {
  0: "CONNECTING",
  1: "OPEN",
  2: "CLOSING",
  3: "CLOSED",
  4: "TAB_INACTIVE",
  5: "RECONNECTING",
} as const;

type WsReadyState = typeof wsReadyStateText;

const WS_TAB_INACTIVE = 4;
const WS_RECONNECTING = 5;

let websocketInstance: WebSocket | null = null;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

const createWebSocket = (
  queryClient: ReturnType<typeof useQueryClient>,
  setReadyState: (state: keyof WsReadyState) => void,
  isActive: boolean,
): WebSocket => {
  connectionAttempts++;
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    connectionAttempts = 0;
    setReadyState(1 as keyof WsReadyState);
  };

  ws.onmessage = async (event) => {
    setReadyState(ws.readyState as keyof WsReadyState);
    if (typeof event.data !== "string") {return;}
    try {
      await handleWebSocketMessage(queryClient, event.data);
    } catch (error) {
      console.error("WS handler error", error);
    }
  };

  ws.onclose = () => {
    if (!isActive) {
      setReadyState(WS_TAB_INACTIVE as keyof WsReadyState);
    } else {
      setReadyState(ws.readyState as keyof WsReadyState);
    }
    websocketInstance = null;
  };

  ws.onerror = () => setReadyState(ws.readyState as keyof WsReadyState);

  return ws;
};

export const useWebSocketConnection = (): WsReadyStateText => {
  const queryClient = useQueryClient();
  const isTabActive = useTabVisibility();
  const [readyState, setReadyState] = useState<keyof WsReadyState>(
    WebSocket.CONNECTING,
  );

  useEffect(() => {
    if (!WS_URL) {
      setReadyState(WebSocket.CLOSED);
      return;
    }

    const initializeWebSocket = () => {
      if (!isTabActive) {
        setReadyState(WS_TAB_INACTIVE as keyof WsReadyState);
        return;
      }
      if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
        setReadyState(WebSocket.CLOSED);
        return;
      }
      if (connectionAttempts > 0) {
        setReadyState(WS_RECONNECTING as keyof WsReadyState);
      }
      if (
        !websocketInstance ||
        websocketInstance.readyState === WebSocket.CLOSED
      ) {
        websocketInstance = createWebSocket(
          queryClient,
          setReadyState,
          isTabActive,
        );
      } else if (websocketInstance.readyState === WebSocket.OPEN) {
        setReadyState(1 as keyof WsReadyState);
      } else {
        setReadyState(websocketInstance.readyState as keyof WsReadyState);
      }
    };

    if (isTabActive) {
      if (
        !websocketInstance ||
        websocketInstance.readyState !== WebSocket.OPEN
      ) {
        initializeWebSocket();
      } else {
        setReadyState(1 as keyof WsReadyState);
      }
    } else {
      setReadyState(WS_TAB_INACTIVE as keyof WsReadyState);
    }
  }, [queryClient, isTabActive]);

  return wsReadyStateText[readyState];
};
