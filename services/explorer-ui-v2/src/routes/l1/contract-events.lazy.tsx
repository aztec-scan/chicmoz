import { createLazyFileRoute } from "@tanstack/react-router";
import { L1EventsPage } from "~/pages/l1-events";

export const Route = createLazyFileRoute("/l1/contract-events")({
  component: L1EventsPage,
});
