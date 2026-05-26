import { useChainErrors, useChainInfo } from "~/hooks/api";
import { type ComponentHealth } from "~/hooks/use-system-health";
import { formatDuration } from "~/lib/utils";

export type ChainHealthLevel = "ok" | "unknown" | "unhealthy" | "down";

export interface ChainHealthStatus {
  level: ChainHealthLevel;
  label: string;
  dotClass: string;
  reason: string;
  components: ComponentHealth[];
}

const RECENT_ERROR_WINDOW_MS = 5 * 60 * 1_000;

/**
 * Network/chain health only. This intentionally excludes Aztec-Scan-only
 * signals such as browser WebSocket state so UI outages do not masquerade as
 * L2 chain outages. If explorer data is unavailable, chain health is unknown.
 */
export const useChainHealth = (): ChainHealthStatus => {
  const {
    data: chainInfo,
    error: chainInfoError,
    isLoading: chainInfoLoading,
  } = useChainInfo();
  const {
    data: chainErrors,
    error: chainErrorsError,
    isLoading: chainErrorsLoading,
  } = useChainErrors();

  const recentCutoff = Date.now() - RECENT_ERROR_WINDOW_MS;
  const recentErrors = (chainErrors ?? []).filter(
    (error) => error.lastSeenAt.getTime() > recentCutoff,
  );
  const windowString = formatDuration(RECENT_ERROR_WINDOW_MS);

  const components: ComponentHealth[] = [
    {
      componentId: "Chain metadata",
      health: chainInfo ? "UP" : "UNKNOWN",
      description: "Checks whether Aztec chain metadata can be read",
      evaluationDetails: chainInfo
        ? `network: ${chainInfo.l2NetworkId}\nrollup version: ${chainInfo.rollupVersion.toString()}`
        : chainInfoLoading
          ? "loading /api/l2/info"
          : `chain info unavailable: ${chainInfoError?.message ?? "no data"}`,
    },
    {
      componentId: "Indexer error feed",
      health: chainErrorsError
        ? "UNKNOWN"
        : recentErrors.length > 0
          ? "UNHEALTHY"
          : "UP",
      description: `Checks for indexer-reported chain/RPC errors within ${windowString}`,
      evaluationDetails: chainErrorsError
        ? `error feed unavailable: ${chainErrorsError.message}`
        : chainErrorsLoading
          ? "loading /api/l2/errors"
          : recentErrors.length > 0
            ? `${recentErrors.length} recent error${recentErrors.length === 1 ? "" : "s"}: ${recentErrors.map((error) => error.name).join(", ")}`
            : `no errors in the last ${windowString}`,
    },
  ];

  const unknown = components.filter((component) => component.health === "UNKNOWN");
  if (unknown.length > 0) {
    return {
      level: "unknown",
      label: "CHAIN UNKNOWN",
      dotClass: "dot unknown",
      reason: unknown.map((component) => component.componentId).join(", "),
      components,
    };
  }

  const unhealthy = components.filter(
    (component) => component.health === "UNHEALTHY",
  );
  if (unhealthy.length > 0) {
    return {
      level: "unhealthy",
      label: "CHAIN UNHEALTHY",
      dotClass: "dot warn",
      reason: unhealthy.map((component) => component.componentId).join(", "),
      components,
    };
  }

  return {
    level: "ok",
    label: "CHAIN OK",
    dotClass: "dot",
    reason: "All chain signals available",
    components,
  };
};
