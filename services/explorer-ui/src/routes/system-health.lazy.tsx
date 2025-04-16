import { createLazyFileRoute } from "@tanstack/react-router";
import { SystemHealth } from "~/pages/system-health";

export const Route = createLazyFileRoute("/system-health")({
  component: SystemHealth,
});
