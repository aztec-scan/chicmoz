import { type ChicmozL2RpcNodeError } from "@chicmoz-pkg/types";
import { useEffect, useState } from "react";
import { getLastError, getLastSuccessfulRequest } from "~/api/client";
import { useChainErrors } from "~/hooks/api";
import {
  type WsReadyStateText,
  useWebSocketConnection,
} from "~/hooks/websocket";
import { formatDuration } from "~/lib/utils";

export type ComponentHealthStatus = "UP" | "UNHEALTHY" | "DOWN";

export interface ComponentHealth {
  componentId: string;
  health: ComponentHealthStatus;
  description: string;
  evaluationDetails: string;
}

export interface EvaluatedSystemHealth {
  systemHealth: {
    health: ComponentHealthStatus;
    reason: string;
  };
  components: ComponentHealth[];
}

const API_POLL_INTERVAL = 1_000;
const REASONABLE_API_LIVENESS_MS = 5 * 60 * 1_000;

type LastSuccess = ReturnType<typeof getLastSuccessfulRequest>;
type LastError = ReturnType<typeof getLastError>;

const evaluate = ({
  webSocketReadyState,
  lastSuccessfulRequest,
  lastError,
  chainErrors,
  chainErrorsError,
}: {
  webSocketReadyState: WsReadyStateText;
  lastSuccessfulRequest: LastSuccess;
  lastError: LastError;
  chainErrors: ChicmozL2RpcNodeError[] | undefined;
  chainErrorsError: Error | null;
}): EvaluatedSystemHealth => {
  const components: ComponentHealth[] = [];
  const reasonableTimestamp = Date.now() - REASONABLE_API_LIVENESS_MS;
  const reasonableString = formatDuration(REASONABLE_API_LIVENESS_MS);

  const apiConnected = !!lastSuccessfulRequest;
  components.push({
    componentId: "API-connectivity",
    health: apiConnected ? "UP" : "DOWN",
    description: "Checks if there has been a successful request to the API",
    evaluationDetails: apiConnected
      ? `lastSuccessfulRequest: ${lastSuccessfulRequest?.path ?? "—"}`
      : `lastError: ${lastError?.error.message ?? "—"}`,
  });

  const hadRecentSuccess =
    lastSuccessfulRequest &&
    lastSuccessfulRequest.date.getTime() > reasonableTimestamp;
  const errorFreeWithinWindow =
    (lastError?.date.getTime() ?? 0) < reasonableTimestamp;

  components.push({
    componentId: "API-liveness",
    health: hadRecentSuccess ? "UP" : "DOWN",
    description: `Checks if there have been any successful requests within ${reasonableString}`,
    evaluationDetails: `last successful request: ${lastSuccessfulRequest?.path ?? "—"}`,
  });

  components.push({
    componentId: "API-quality",
    health: hadRecentSuccess && errorFreeWithinWindow ? "UP" : "UNHEALTHY",
    description: `Checks if there have been both successful requests and no errors within ${reasonableString}`,
    evaluationDetails: `last successful request: ${lastSuccessfulRequest?.path ?? "—"}\nlast error: ${lastError?.error.message ?? "—"}`,
  });

  const chainErrorFree =
    chainErrors?.every(
      (e) => e.lastSeenAt.getTime() < reasonableTimestamp,
    ) ?? true;
  const chainUp = chainErrorFree && !chainErrorsError;
  components.push({
    componentId: "Indexer",
    health: chainUp ? "UP" : "UNHEALTHY",
    description: `Checks if the indexer has reported any errors within ${reasonableString}`,
    evaluationDetails: chainErrorsError
      ? `Fetching errors failed: ${chainErrorsError.message}`
      : chainUp
        ? "No recent indexer errors"
        : `Indexer has reported ${chainErrors?.length ?? 0} errors`,
  });

  components.push({
    componentId: "WebSocket",
    health: webSocketReadyState === "OPEN" ? "UP" : "UNHEALTHY",
    description:
      "Checks if the WebSocket between the frontend and backend is open",
    evaluationDetails: `WebSocket ready state: ${webSocketReadyState}`,
  });

  const down = components.filter((c) => c.health === "DOWN");
  if (down.length > 0) {
    return {
      systemHealth: {
        health: "DOWN",
        reason: down.map((c) => c.componentId).join(", "),
      },
      components,
    };
  }
  const unhealthy = components.filter((c) => c.health === "UNHEALTHY");
  if (unhealthy.length > 0) {
    return {
      systemHealth: {
        health: "UNHEALTHY",
        reason: unhealthy.map((c) => c.componentId).join(", "),
      },
      components,
    };
  }
  return {
    systemHealth: { health: "UP", reason: "All systems operational" },
    components,
  };
};

/**
 * Evaluates aztec-scan's own infrastructure health (API connectivity, liveness,
 * quality, indexer errors, WebSocket state) by sampling the shared API client's
 * last-success/last-error trackers.
 */
export const useSystemHealth = (): EvaluatedSystemHealth => {
  const wsReadyState = useWebSocketConnection();
  const [lastSuccess, setLastSuccess] = useState<LastSuccess>(null);
  const [lastErr, setLastErr] = useState<LastError>(null);
  const { data: chainErrors, error: chainErrorsError } = useChainErrors();

  useEffect(() => {
    const id = setInterval(() => {
      const s = getLastSuccessfulRequest();
      const e = getLastError();
      if (s !== lastSuccess) {setLastSuccess(s);}
      if (e !== lastErr) {setLastErr(e);}
    }, API_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [lastErr, lastSuccess]);

  return evaluate({
    webSocketReadyState: wsReadyState,
    lastSuccessfulRequest: lastSuccess,
    lastError: lastErr,
    chainErrors,
    chainErrorsError,
  });
};
