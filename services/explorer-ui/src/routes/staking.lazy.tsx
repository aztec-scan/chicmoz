import { createLazyFileRoute } from "@tanstack/react-router";
import { Staking } from "~/pages/staking";

export const Route = createLazyFileRoute("/staking")({
  component: Staking,
});
