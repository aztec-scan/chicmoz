import { createLazyFileRoute } from "@tanstack/react-router";
import { TermsAndConditionsPage } from "~/pages/static/terms";

export const Route = createLazyFileRoute("/terms-and-conditions")({
  component: TermsAndConditionsPage,
});
