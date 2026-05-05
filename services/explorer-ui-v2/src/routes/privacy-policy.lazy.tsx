import { createLazyFileRoute } from "@tanstack/react-router";
import { PrivacyPolicyPage } from "~/pages/static/privacy-policy";

export const Route = createLazyFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
});
