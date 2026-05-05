import { createLazyFileRoute } from "@tanstack/react-router";
import { AztecscanHealthPage } from "~/pages/health/aztecscan";

export const Route = createLazyFileRoute("/health/aztecscan")({
  component: AztecscanHealthPage,
});
