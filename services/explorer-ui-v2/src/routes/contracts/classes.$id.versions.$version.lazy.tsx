import { createLazyFileRoute } from "@tanstack/react-router";
import { ContractClassPage } from "~/pages/contract-class";

export const Route = createLazyFileRoute(
  "/contracts/classes/$id/versions/$version",
)({
  component: ContractClassPage,
});
