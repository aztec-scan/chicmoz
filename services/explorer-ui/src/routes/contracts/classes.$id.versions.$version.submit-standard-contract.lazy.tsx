import { createLazyFileRoute } from "@tanstack/react-router";
import { SubmitStandardContract } from "~/pages/submit-standard-contract";

export const Route = createLazyFileRoute(
  "/contracts/classes/$id/versions/$version/submit-standard-contract",
)({
  component: SubmitStandardContract,
});
