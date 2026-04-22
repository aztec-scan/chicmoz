import { createLazyFileRoute } from "@tanstack/react-router";
import { StakingPage } from "~/pages/staking";

export const Route = createLazyFileRoute("/staking")({
  component: StakingPage,
});
