import { createLazyFileRoute } from "@tanstack/react-router";
import { ValidatorDetailsPage } from "~/pages/l1/validator-details";

export const Route = createLazyFileRoute("/l1/validators/$attesterAddress")({
  component: ValidatorDetailsPage,
});
