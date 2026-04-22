import { createLazyFileRoute } from "@tanstack/react-router";
import { TxDetailPage } from "~/pages/tx-detail";

export const Route = createLazyFileRoute("/tx-effects/$hash")({
  component: TxDetailPage,
});
