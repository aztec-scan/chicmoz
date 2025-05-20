import { createLazyFileRoute } from "@tanstack/react-router";
import { ValidatorsPage } from "~/pages/l1/validators";

export const Route = createLazyFileRoute("/l1/validators/")({
  component: ValidatorsPage,
});
