import { createLazyFileRoute } from "@tanstack/react-router";
import { SubmitStandardContractPage } from "~/pages/submit-standard-contract";

export const Route = createLazyFileRoute(
  "/contracts/classes/$id/versions/$version/submit-standard-contract",
)({
  component: SubmitStandardContractPage,
});
