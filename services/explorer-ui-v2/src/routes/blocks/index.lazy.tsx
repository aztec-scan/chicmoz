import { createLazyFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "~/pages/blocks";

export const Route = createLazyFileRoute("/blocks/")({
  component: BlocksPage,
});
