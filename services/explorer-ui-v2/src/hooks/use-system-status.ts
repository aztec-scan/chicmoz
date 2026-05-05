import { useSystemHealth } from "~/hooks/use-system-health";

export type SystemStatusLevel = "ok" | "unhealthy" | "down";

interface SystemStatus {
  level: SystemStatusLevel;
  label: string;
  dotClass: string;
}

const STATUS_MAP: Record<"UP" | "UNHEALTHY" | "DOWN", SystemStatus> = {
  UP: { level: "ok", label: "CHAIN OK", dotClass: "dot" },
  UNHEALTHY: { level: "unhealthy", label: "CHAIN UNHEALTHY", dotClass: "dot warn" },
  DOWN: { level: "down", label: "CHAIN DOWN", dotClass: "dot down" },
};

/**
 * Coarse pill summary derived from useSystemHealth — single source of truth
 * for system state. Used in the topbar and network health header.
 */
export const useSystemStatus = (): SystemStatus => {
  const { systemHealth } = useSystemHealth();
  return STATUS_MAP[systemHealth.health];
};
