import { createFileRoute } from "@tanstack/react-router";
import { NetworkHealth } from "~/pages/network-health";

export const Route = createFileRoute("/network-health")({
  component: NetworkHealth,
});
