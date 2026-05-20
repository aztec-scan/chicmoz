import { createLazyFileRoute } from "@tanstack/react-router";
import { ContractsPage } from "~/pages/contracts";

export const Route = createLazyFileRoute("/contracts/")({
  component: ContractsPage,
});
