import { createLazyFileRoute } from "@tanstack/react-router";
import { ValidatorDetailPage } from "~/pages/validator-detail";

export const Route = createLazyFileRoute("/validators/$attesterAddress")({
  component: ValidatorDetailPage,
});
