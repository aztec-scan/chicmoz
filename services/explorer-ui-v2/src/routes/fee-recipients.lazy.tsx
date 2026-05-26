import { createLazyFileRoute } from "@tanstack/react-router";
import { FeeRecipientsPage } from "~/pages/fee-recipients";

export const Route = createLazyFileRoute("/fee-recipients")({
  component: FeeRecipientsPage,
});
