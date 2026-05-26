import { createLazyFileRoute } from "@tanstack/react-router";
import { TxsPage } from "~/pages/txs";

export const Route = createLazyFileRoute("/tx-effects/")({
  component: TxsPage,
});
