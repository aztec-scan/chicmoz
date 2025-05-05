import { createLazyFileRoute } from "@tanstack/react-router";
import { AztecscanHealth } from "~/pages/aztecscan-health";

export const Route = createLazyFileRoute("/aztecscan-health")({
  component: AztecscanHealth,
});
