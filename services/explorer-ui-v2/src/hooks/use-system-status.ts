import { useChainErrors } from "~/hooks/api";
import { useWebSocketConnection } from "~/hooks/websocket";

export type SystemStatusLevel = "ok" | "unhealthy" | "down";

interface SystemStatus {
  level: SystemStatusLevel;
  label: string;
  dotClass: string;
}

const FIVE_MIN_MS = 5 * 60 * 1000;

/**
 * Surfaces a coarse "CHAIN OK / CHAIN UNHEALTHY / CHAIN DOWN" pill for the topbar.
 * Considers both live websocket state and recent chain-error payloads from the indexer.
 */
export const useSystemStatus = (): SystemStatus => {
  const ws = useWebSocketConnection();
  const { data: chainErrors, error: chainErrorsError } = useChainErrors();

  const now = Date.now();
  const recentChainError = chainErrors?.some(
    (e) => now - e.lastSeenAt.getTime() < FIVE_MIN_MS,
  );

  if (ws === "CLOSED" || chainErrorsError) {
    return { level: "down", label: "CHAIN DOWN", dotClass: "dot down" };
  }
  if (ws !== "OPEN" && ws !== "TAB_INACTIVE") {
    return { level: "unhealthy", label: "CONNECTING", dotClass: "dot warn" };
  }
  if (recentChainError) {
    return {
      level: "unhealthy",
      label: "CHAIN UNHEALTHY",
      dotClass: "dot warn",
    };
  }
  return { level: "ok", label: "CHAIN OK", dotClass: "dot" };
};
