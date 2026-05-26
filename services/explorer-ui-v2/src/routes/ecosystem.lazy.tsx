import { createLazyFileRoute } from "@tanstack/react-router";
import { EcosystemPage } from "~/pages/ecosystem";

export const Route = createLazyFileRoute("/ecosystem")({
  component: EcosystemPage,
});
