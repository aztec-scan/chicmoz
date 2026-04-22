import { createLazyFileRoute } from "@tanstack/react-router";
import { ContractInstancePage } from "~/pages/contract-instance";

export const Route = createLazyFileRoute("/contracts/instances/$address")({
  component: ContractInstancePage,
});
