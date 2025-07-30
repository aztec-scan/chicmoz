import { type ChicmozL2RpcNodeError } from "@chicmoz-pkg/types";
import { useEffect, useState } from "react";
import { formatDuration, formatTimeSince } from "~/lib/utils";
import { useChainErrors } from ".";
import { getLastError, getLastSuccessfulRequest } from "../api/client";
import { useWebSocketConnection, type WsReadyStateText } from "./websocket";

export enum HealthStatus {
  DOWN = "DOWN",
  UP = "UP",
  UNHEALTHY = "UNHEALTHY",
}

export type ComponentHealth = {
  health: HealthStatus;
  componentId: string;
  description: string;
  evaluationDetails: string;
};

export type EvaluatedSystemHealth = {
  systemHealth: {
    health: HealthStatus;
    reason: string;
  };
  components: ComponentHealth[];
};

const API_POLL_INTERVAL = 1000;
const REASONABLE_API_LIVENESS_TIME = 1000 * 60 * 5;

const evaluateHealth = ({
  webSocketReadyState,
  lastSuccessfulRequest,
  lastError,
  chainErrors,
  chainErrorsError,
}: {
  webSocketReadyState: WsReadyStateText;
  lastSuccessfulRequest: { date: Date; path: string } | null;
  lastError: {
    date: Date;
    error: { type: "API" | "Schema"; status: number; message: string };
  } | null;
  chainErrors: ChicmozL2RpcNodeError[] | undefined;
  chainErrorsError: Error | null;
}): EvaluatedSystemHealth => {
  const evaluations: ComponentHealth[] = [];
  const reasonableTimeStamp = Date.now() - REASONABLE_API_LIVENESS_TIME;
  const reasonableTimeString = formatDuration(
    REASONABLE_API_LIVENESS_TIME
  );

  const isApiConnectionHealthy = !!lastSuccessfulRequest;
  evaluations.push({
    health: isApiConnectionHealthy ? HealthStatus.UP : HealthStatus.DOWN,
    componentId: "API-connectivity",
    description: "Checks if there has been a successful request to the API",
    evaluationDetails: isApiConnectionHealthy
      ? `lastSuccessfulRequest: ${lastSuccessfulRequest?.path}`
      : `lastError: ${lastError?.error.message}`,
  });

  const hasBeenSuccessfulRequestWithinReasonableTime =
    lastSuccessfulRequest &&
    lastSuccessfulRequest.date.getTime() > reasonableTimeStamp;

  const errorFreeWithinReasonableTime =
    (lastError?.date?.getTime() ?? 0) < reasonableTimeStamp;

  evaluations.push({
    health: !hasBeenSuccessfulRequestWithinReasonableTime
      ? HealthStatus.DOWN
      : HealthStatus.UP,
    componentId: "API-livesness",
    description: `Checks if there have been any successful requests within ${reasonableTimeString}`,
    evaluationDetails: `last successful request: ${lastSuccessfulRequest?.path}`,
  });

  evaluations.push({
    health:
      hasBeenSuccessfulRequestWithinReasonableTime &&
      errorFreeWithinReasonableTime
        ? HealthStatus.UP
        : HealthStatus.UNHEALTHY,
    componentId: "API-quality",
    description: `Checks if there have been both successful requests and no errors within ${reasonableTimeString}`,
    evaluationDetails: `last successful request: ${lastSuccessfulRequest?.path}\nlast error: ${lastError?.error.message}`,
  });

  const isChainErrorFreeWithinReasonableTime = chainErrors?.every(
    (error) => error.lastSeenAt.getTime() < reasonableTimeStamp
  );
  const isErrorsWithFetchingChainErrors = !!chainErrorsError;
  const isChainUp =
    isChainErrorFreeWithinReasonableTime && !isErrorsWithFetchingChainErrors;
  let evaluationDetails = "";
  if (isChainUp) {
    evaluationDetails = `Last seen error: ${chainErrors?.[0]
      ?.name} at ${formatTimeSince(
      chainErrors?.[0]?.lastSeenAt.getTime() ?? 0
    )} ago`;
  } else {
    if (isErrorsWithFetchingChainErrors)
      evaluationDetails = `Trying to fetch errors failed: ${chainErrorsError?.message}`;
    else
      evaluationDetails = `Indexer has reported ${chainErrors?.length} errors.`;
  }
  evaluations.push({
    health: isChainUp ? HealthStatus.UP : HealthStatus.UNHEALTHY,
    componentId: "Indexer",
    description: `Checks if the indexer (backend) has reported any errors within ${reasonableTimeString}`,
    evaluationDetails,
  });

  evaluations.push({
    health:
      webSocketReadyState === "OPEN" ? HealthStatus.UP : HealthStatus.UNHEALTHY,
    componentId: "WebSocket",
    description:
      "Checks if the WebSocket between the frontend and backend is open",
    evaluationDetails: `WebSocket ready state: ${webSocketReadyState}`,
  });

  const downComponents = evaluations.filter(
    (evaluation) => evaluation.health === HealthStatus.DOWN
  );
  if (downComponents.length) {
    return {
      systemHealth: {
        health: HealthStatus.DOWN,
        reason: downComponents.map((c) => c.componentId).join(", "),
      },
      components: evaluations,
    };
  }
  const unhealthyComponents = evaluations.filter(
    (evaluation) => evaluation.health === HealthStatus.UNHEALTHY
  );
  if (unhealthyComponents.length) {
    return {
      systemHealth: {
        health: HealthStatus.UNHEALTHY,
        reason: unhealthyComponents.map((c) => c.componentId).join(", "),
      },
      components: evaluations,
    };
  }
  return {
    systemHealth: {
      health: HealthStatus.UP,
      reason: "All systems are operational",
    },
    components: evaluations,
  };
};

export const useSystemHealth = () => {
  const wsReadyState = useWebSocketConnection();
  const [lastSuccessfulRequest, setLastSuccessfulRequest] = useState<{
    date: Date;
    path: string;
  } | null>(null);
  const [lastError, setLastError] = useState<{
    date: Date;
    error: { type: "API" | "Schema"; message: string; status: number };
  } | null>(null);
  const { data: chainErrors, error: chainErrorsError } = useChainErrors();

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentLastSuccessfulRequest = getLastSuccessfulRequest();
      const currentLastError = getLastError();

      if (currentLastSuccessfulRequest !== lastSuccessfulRequest)
        setLastSuccessfulRequest(currentLastSuccessfulRequest);

      if (currentLastError !== lastError) setLastError(currentLastError);
    }, API_POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [lastError, lastSuccessfulRequest]);

  const systemHealth = evaluateHealth({
    webSocketReadyState: wsReadyState,
    lastSuccessfulRequest,
    lastError,
    chainErrors,
    chainErrorsError,
  });
  return systemHealth;
};
