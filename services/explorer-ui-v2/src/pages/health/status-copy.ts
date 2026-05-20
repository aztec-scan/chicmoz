import { type ComponentHealthStatus } from "~/hooks/use-system-health";

export const STATUS_LABEL: Record<ComponentHealthStatus, string> = {
  UP: "UP",
  UNKNOWN: "UNKNOWN",
  UNHEALTHY: "UNHEALTHY",
  DOWN: "DOWN",
};

export const STATUS_TONE: Record<
  ComponentHealthStatus,
  "ok" | "unknown" | "warn" | "down"
> = {
  UP: "ok",
  UNKNOWN: "unknown",
  UNHEALTHY: "warn",
  DOWN: "down",
};

interface StatusCopy {
  label: string;
  tone: "ok" | "unknown" | "warn" | "down";
  copy: string;
}

export const statusCopy = (health: ComponentHealthStatus): StatusCopy => ({
  label: STATUS_LABEL[health],
  tone: STATUS_TONE[health],
  copy:
    health === "UP"
      ? "operational"
      : health === "UNKNOWN"
        ? "unknown"
        : health === "UNHEALTHY"
          ? "degraded"
          : "attention required",
});
