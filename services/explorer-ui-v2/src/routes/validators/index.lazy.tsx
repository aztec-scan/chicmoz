import { createLazyFileRoute } from "@tanstack/react-router";
import { ValidatorsPage } from "~/pages/validators";

export const Route = createLazyFileRoute("/validators/")({
  component: ValidatorsPage,
});
