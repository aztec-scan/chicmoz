import { createLazyFileRoute } from "@tanstack/react-router";
import { CatchupDevPage } from "~/pages/dev/catchup";

export const Route = createLazyFileRoute("/dev")({
  component: CatchupDevPage,
});
