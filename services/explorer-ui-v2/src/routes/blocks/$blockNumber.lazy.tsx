import { createLazyFileRoute } from "@tanstack/react-router";
import { BlockDetailPage } from "~/pages/block-detail";

export const Route = createLazyFileRoute("/blocks/$blockNumber")({
  component: BlockDetailPage,
});
