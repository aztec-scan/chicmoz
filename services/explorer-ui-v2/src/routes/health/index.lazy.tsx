import { createLazyFileRoute } from "@tanstack/react-router";
import { NetworkHealthPage } from "~/pages/health/network";

export const Route = createLazyFileRoute("/health/")({
  component: NetworkHealthPage,
});
