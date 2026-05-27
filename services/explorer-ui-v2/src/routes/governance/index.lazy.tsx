import { createLazyFileRoute } from "@tanstack/react-router";
import { GovernancePage } from "~/pages/governance";

export const Route = createLazyFileRoute("/governance/")({
  component: GovernancePage,
});
