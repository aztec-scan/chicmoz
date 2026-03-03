import { createLazyFileRoute } from "@tanstack/react-router";
import { Incidents } from "~/pages/incidents";

export const Route = createLazyFileRoute("/incidents")({
  component: Incidents,
});
