import { createFileRoute, Link } from "@tanstack/react-router";
import { type FC } from "react";
import { ConsoleHead, Shell } from "~/components/layout";

export const Route = createFileRoute("/governance/proposal/$payloadAddress")();

export const GovernanceProposalDetailPage: FC = () => {
  const { payloadAddress } = Route.useParams();

  return (
    <Shell active="governance">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "governance", to: "/governance" },
          { label: "proposal", active: true },
        ]}
        comment={`proposal details for ${payloadAddress}`}
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Proposal Details</h3>
        </div>

        <div className="empty-state" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>TODO: Proposal detail page</p>
          <p style={{ color: "var(--ink-3)", marginBottom: "1rem" }}>
            Payload: <code style={{ background: "var(--bg-2)", padding: "0.15rem 0.4rem", borderRadius: 4 }}>{payloadAddress}</code>
          </p>
          <p style={{ color: "var(--ink-3)", fontSize: "0.85rem" }}>
            Will show proposal state, vote tallies, signals, and linked data queried by payload address.
          </p>
          <Link
            to="/governance"
            className="back-link"
            style={{ display: "inline-block", marginTop: "1rem", color: "var(--accent)" }}
          >
            &larr; Back to governance
          </Link>
        </div>
      </div>
    </Shell>
  );
};
