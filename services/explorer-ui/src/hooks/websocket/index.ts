import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

// Custom ready states for inactive tab and reconnecting states
const WS_TAB_INACTIVE = 4;
const WS_RECONNECTING = 5;

// Singleton WebSocket instance to prevent multiple connections
let websocketInstance: WebSocket | null = null;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
let isTabActive = !document.hidden; // Initialize based on current visibility state

// Function to create and configure WebSocket
const createWebSocket = (
  queryClient: ReturnType<typeof useQueryClient>,
  setReadyState: (state: keyof WsReadyState) => void,
): WebSocket => {
  connectionAttempts++;
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("WebSocket Connected");
    connectionAttempts = 0; // Reset connection attempts on successful connection
    setReadyState(ws.readyState as keyof WsReadyState);
  };

  ws.onmessage = async (event) => {
    setReadyState(ws.readyState as keyof WsReadyState);
    if (typeof event.data !== "string") {
      console.error("WebSocket message is not a string");
    }
    try {
      await handleWebSocketMessage(queryClient, event.data as string);
    } catch (error) {
      console.error("Error handling WebSocket message", error);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket Disconnected");

    // If tab is inactive, set special state
    if (!isTabActive) {
      setReadyState(WS_TAB_INACTIVE as keyof WsReadyState);
    } else {
      setReadyState(ws.readyState as keyof WsReadyState);
    }

    websocketInstance = null; // Clear the reference when closed
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    setReadyState(ws.readyState as keyof WsReadyState);
  };

  return ws;
};

export const useWebSocketConnection = (): WsReadyStateText => {
  const queryClient = useQueryClient();
  const [readyState, setReadyState] = useState<keyof WsReadyState>(
    WebSocket.CONNECTING,
  );

  // Handle page visibility changes
  useEffect(() => {
    // Function to initialize or reconnect WebSocket
    const initializeWebSocket = () => {
      if (!isTabActive) {
        // Don't try to connect if tab is inactive
        setReadyState(WS_TAB_INACTIVE as keyof WsReadyState);
        return;
      }

      // Check if we've reached max retry attempts
      if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
        console.log(
          `Maximum WebSocket connection attempts (${MAX_RETRY_ATTEMPTS}) reached, not retrying.`,
        );
        setReadyState(WebSocket.CLOSED);
        return;
      }

      // If we need to reconnect and already have a connection attempt, set reconnecting state
      if (connectionAttempts > 0) {
        setReadyState(WS_RECONNECTING as keyof WsReadyState);
      }

      // Create new WebSocket if one doesn't exist or is closed
      if (
        !websocketInstance ||
        websocketInstance.readyState === WebSocket.CLOSED
      ) {
        websocketInstance = createWebSocket(queryClient, setReadyState);
      } else {
        // Update readyState to match existing connection
        setReadyState(websocketInstance.readyState as keyof WsReadyState);
      }
    };
    
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      console.log(`Tab is now ${isTabActive ? "active" : "inactive"}`);

      if (isTabActive) {
        // Tab became active, check WebSocket status and reconnect if needed
        if (
          !websocketInstance ||
          websocketInstance.readyState !== WebSocket.OPEN
        ) {
          console.log("Tab active - checking WebSocket connection");
          initializeWebSocket();
        }
      } else {
        // Tab became inactive, update state
        setReadyState(WS_TAB_INACTIVE as keyof WsReadyState);
      }
    };

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initialize WebSocket on first render
    initializeWebSocket();

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  return wsReadyStateText[readyState];
};
