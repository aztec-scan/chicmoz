import { createLazyFileRoute } from "@tanstack/react-router";
import { GovernanceProposalDetailPage } from "~/pages/governance-proposal-detail";

export const Route = createLazyFileRoute("/governance/proposal/$payloadAddress")({
  component: GovernanceProposalDetailPage,
});
