import { useParams } from "@tanstack/react-router";
import { type FC, type ReactNode, useMemo } from "react";
import {
  type ChicmozL1GovernanceProposal,
  type ChicmozL1GovernanceSignal,
  type ChicmozL1GovernanceVote,
} from "@chicmoz-pkg/types";
import { AddressEtherscanLink, TxEtherscanLink } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useChainInfo,
  useGovernanceProposal,
  useGovernanceProposalSignals,
  useGovernanceProposalVotes,
  useGovernanceProposals,
} from "~/hooks/api";
import {
  ageStr,
  fmtNum,
  formatDuration,
  formatStake,
  getStakingAssetSymbol,
  truncateHashString,
} from "~/lib/utils";

type Phase = {
  key: string;
  label: string;
  at?: Date | null;
  description: string;
};

type VoteBucket = {
  key: string;
  label: string;
  yea: bigint;
  nay: bigint;
  total: bigint;
};

type SignalRound = {
  round: bigint;
  count: number;
};

const stateColor = (state: string): string => {
  switch (state) {
    case "Pending":
      return "var(--ink-3)";
    case "Active":
      return "#c99800";
    case "Queued":
      return "#60a5fa";
    case "Executable":
      return "#34d399";
    case "Executed":
      return "#22c55e";
    case "Dropped":
      return "#ef4444";
    default:
      return "var(--ink-2)";
  }
};

const COMPLETED_PHASE_COLOR = "#22c55e";

const isCurrentPhase = (
  phaseKey: Phase["key"],
  state: ChicmozL1GovernanceProposal["state"],
): boolean => {
  switch (state) {
    case "Pending":
      return phaseKey === "pending";
    case "Active":
      return phaseKey === "active";
    case "Queued":
      return phaseKey === "queued";
    case "Executable":
      return phaseKey === "executable";
    default:
      return false;
  }
};

const getPhaseColor = (
  phase: Phase,
  proposal: ChicmozL1GovernanceProposal,
): string => {
  if (isCurrentPhase(phase.key, proposal.state)) {
    return stateColor(proposal.state);
  }
  if (phase.at && phase.at.getTime() <= Date.now()) {
    return COMPLETED_PHASE_COLOR;
  }
  return "var(--bg-2)";
};

const toBigInt = (value: bigint | string | number | null | undefined): bigint => {
  if (value === null || value === undefined) {
    return 0n;
  }
  try {
    return typeof value === "bigint" ? value : BigInt(value);
  } catch {
    return 0n;
  }
};

const getProposalTitle = (proposal: ChicmozL1GovernanceProposal): string =>
  proposal.title ?? proposal.metadata?.title ?? proposal.uri ?? "Untitled proposal";

const dateLabel = (date?: Date | null): string =>
  date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";

const ProposalHero: FC<{
  proposal: ChicmozL1GovernanceProposal;
  stakingAssetDecimals: number;
  stakingAssetSymbol: string;
}> = ({ proposal, stakingAssetDecimals, stakingAssetSymbol }) => {
  const yea = toBigInt(proposal.summedYea);
  const nay = toBigInt(proposal.summedNay);
  const total = yea + nay;
  const yeaPct = total > 0n ? Number((yea * 100n) / total) : 0;
  const nayPct = total > 0n ? 100 - yeaPct : 0;

  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-head">
        <h3>
          Proposal #{proposal.proposalId}
          <span className="c"> · richer detail concept</span>
        </h3>
        <span className="state-pill" style={{ color: stateColor(proposal.state) }}>
          {proposal.state}
        </span>
      </div>

      <div style={{ display: "grid", gap: "1rem", padding: "1rem" }}>
        <div>
          <div className="lbl">Payload</div>
          <div style={{ fontFamily: "var(--mono)", overflowWrap: "anywhere" }}>
            {proposal.payloadAddress}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "1.35rem", margin: 0 }}>{getProposalTitle(proposal)}</h2>
          <p style={{ color: "var(--ink-3)", margin: "0.5rem 0 0" }}>
            Created {ageStr(proposal.createdAt)} · L1 block {fmtNum(proposal.l1BlockNumber)}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          }}
        >
          <MetricCard
            label="Yea stake"
            value={formatStake(yea, stakingAssetDecimals, 2)}
            sub={`${stakingAssetSymbol} supporting`}
          />
          <MetricCard
            label="Nay stake"
            value={formatStake(nay, stakingAssetDecimals, 2)}
            sub={`${stakingAssetSymbol} opposing`}
          />
          <MetricCard label="Yea share" value={`${yeaPct}%`} sub={`${nayPct}% nay`} />
          <MetricCard
            label="Quorum needed"
            value={formatStake(proposal.votesNeeded, stakingAssetDecimals, 2)}
            sub={`${stakingAssetSymbol} minimum yea stake`}
          />
        </div>

        <div
          aria-label="proposal vote split"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: 999,
            display: "flex",
            height: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ background: "#22c55e", width: `${yeaPct}%` }} />
          <div style={{ background: "#ef4444", width: `${nayPct}%` }} />
        </div>
      </div>
    </div>
  );
};

const MetricCard: FC<{ label: string; value: string; sub: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="sc" style={{ minHeight: 88 }}>
    <div className="lbl">{label}</div>
    <div className="val">{value}</div>
    <div className="sub">{sub}</div>
  </div>
);

const LifecycleTimeline: FC<{ proposal: ChicmozL1GovernanceProposal }> = ({
  proposal,
}) => {
  const phases: Phase[] = [
    { key: "created", label: "Created", at: proposal.createdAt, description: "proposal observed" },
    { key: "pending", label: "Pending ends", at: proposal.pendingThrough, description: "signaling window" },
    { key: "active", label: "Active ends", at: proposal.activeThrough, description: "stake voting" },
    { key: "queued", label: "Queue ends", at: proposal.queuedThrough, description: "timelock" },
    { key: "executable", label: "Executable ends", at: proposal.executableThrough, description: "execution window" },
  ];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Lifecycle timeline</h3>
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
          padding: "1rem",
        }}
      >
        {phases.map((phase, index) => {
          const phaseColor = getPhaseColor(phase, proposal);
          const isFuturePhase = phaseColor === "var(--bg-2)";
          return (
            <div key={phase.key} style={{ position: "relative" }}>
              <div
                style={{
                  background: phaseColor,
                  border: "1px solid var(--line)",
                  borderRadius: "999px",
                  height: 12,
                  marginBottom: "0.75rem",
                  opacity: isFuturePhase ? 0.65 : 1,
                }}
              />
              <div className="lbl">{index + 1}. {phase.label}</div>
              <div style={{ fontWeight: 700 }}>{dateLabel(phase.at)}</div>
              <div className="sub">{phase.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VoteHistoryChart: FC<{
  votes: ChicmozL1GovernanceVote[];
  stakingAssetDecimals: number;
  stakingAssetSymbol: string;
}> = ({ votes, stakingAssetDecimals, stakingAssetSymbol }) => {
  const buckets = useMemo<VoteBucket[]>(() => {
    const byDay = new Map<string, VoteBucket>();
    for (const vote of votes) {
      const key = vote.l1BlockTimestamp.toISOString().slice(0, 10);
      const label = dateLabel(vote.l1BlockTimestamp);
      const existing = byDay.get(key) ?? { key, label, yea: 0n, nay: 0n, total: 0n };
      if (vote.support) {
        existing.yea += toBigInt(vote.amount);
      } else {
        existing.nay += toBigInt(vote.amount);
      }
      existing.total += toBigInt(vote.amount);
      byDay.set(key, existing);
    }
    return [...byDay.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-14);
  }, [votes]);

  const max = buckets.reduce((acc, bucket) => (bucket.total > acc ? bucket.total : acc), 0n);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Stake vote flow</h3>
        <span className="c">daily buckets · {stakingAssetSymbol}</span>
      </div>
      {buckets.length === 0 ? (
        <div className="empty-state">no votes recorded for this proposal yet</div>
      ) : (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "end", minHeight: 210, padding: "1rem" }}>
          {buckets.map((bucket) => {
            const height = max > 0n ? Math.max(8, Number((bucket.total * 160n) / max)) : 8;
            const yeaPct = bucket.total > 0n ? Number((bucket.yea * 100n) / bucket.total) : 0;
            return (
              <div key={bucket.key} style={{ flex: 1, minWidth: 24, textAlign: "center" }}>
                <div
                  title={`${bucket.label}: ${formatStake(bucket.total, stakingAssetDecimals, 2)} ${stakingAssetSymbol}`}
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: "8px 8px 2px 2px",
                    display: "flex",
                    flexDirection: "column-reverse",
                    height,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ background: "#22c55e", height: `${yeaPct}%` }} />
                  <div style={{ background: "#ef4444", height: `${100 - yeaPct}%` }} />
                </div>
                <div className="sub" style={{ marginTop: "0.4rem" }}>{bucket.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SignalRoundChart: FC<{ signals: ChicmozL1GovernanceSignal[] }> = ({ signals }) => {
  const rounds = useMemo<SignalRound[]>(() => {
    const counts = new Map<string, SignalRound>();
    for (const signal of signals) {
      const key = signal.round.toString();
      const existing = counts.get(key) ?? { round: signal.round, count: 0 };
      existing.count += 1;
      counts.set(key, existing);
    }
    return [...counts.values()].sort((a, b) => Number(a.round - b.round)).slice(-12);
  }, [signals]);

  const max = rounds.reduce((acc, round) => Math.max(acc, round.count), 0);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Signaling by round</h3>
        <span className="c">GovernanceProposer signal casts</span>
      </div>
      {rounds.length === 0 ? (
        <div className="empty-state">no signals recorded for this payload yet</div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", padding: "1rem" }}>
          {rounds.map((round) => (
            <div key={round.round.toString()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="lbl">Round {fmtNum(round.round)}</span>
                <span className="sub">{fmtNum(round.count)} signals</span>
              </div>
              <div style={{ background: "var(--bg-2)", borderRadius: 999, height: 10, overflow: "hidden" }}>
                <div
                  style={{
                    background: "var(--accent)",
                    height: "100%",
                    width: `${max > 0 ? (round.count / max) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProposalDetailsGrid: FC<{
  proposal: ChicmozL1GovernanceProposal;
  votes: ChicmozL1GovernanceVote[];
  signals: ChicmozL1GovernanceSignal[];
  stakingAssetDecimals: number;
  stakingAssetSymbol: string;
}> = ({ proposal, votes, signals, stakingAssetDecimals, stakingAssetSymbol }) => {
  const firstVoteAt = votes[0]?.l1BlockTimestamp;
  const lastVoteAt = votes[votes.length - 1]?.l1BlockTimestamp;
  const voteSpanMs = firstVoteAt && lastVoteAt
    ? lastVoteAt.getTime() - firstVoteAt.getTime()
    : 0;
  const recentVotes = useMemo(
    () => [...votes].sort((a, b) => b.l1BlockTimestamp.getTime() - a.l1BlockTimestamp.getTime()).slice(0, 5),
    [votes],
  );
  const latestActivityTransactionHash = useMemo(() => {
    const latestActivity = [
      ...votes.map((vote) => ({ timestamp: vote.l1BlockTimestamp, transactionHash: vote.l1TransactionHash })),
      ...signals.map((signal) => ({ timestamp: signal.l1BlockTimestamp, transactionHash: signal.l1TransactionHash })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return latestActivity?.transactionHash ?? proposal.l1TransactionHash;
  }, [proposal.l1TransactionHash, signals, votes]);

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      }}
    >
      <div className="panel">
        <div className="panel-head"><h3>Proposal metadata</h3></div>
        <div style={{ display: "grid", gap: "0.75rem", padding: "1rem" }}>
          <DetailRow
            label="Proposer"
            value={
              <AddressEtherscanLink
                address={proposal.proposer ?? undefined}
                content={proposal.proposer ? truncateHashString(proposal.proposer, 8, 6) : "—"}
                title="View proposer address on Etherscan"
              />
            }
          />
          <DetailRow
            label="Governance proposer"
            value={
              <AddressEtherscanLink
                address={proposal.governanceProposerAddress ?? undefined}
                content={
                  proposal.governanceProposerAddress
                    ? truncateHashString(proposal.governanceProposerAddress, 8, 6)
                    : "—"
                }
                title="View governance proposer address on Etherscan"
              />
            }
          />
          <DetailRow label="Snapshot voting power" value={`${formatStake(proposal.snapshotTotalPower, stakingAssetDecimals, 2)} ${stakingAssetSymbol}`} />
          <DetailRow label="Votes cast" value={`${formatStake(proposal.votesCast, stakingAssetDecimals, 2)} ${stakingAssetSymbol}`} />
          <DetailRow label="Finalized" value={proposal.isFinalized ? "yes" : "no"} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Recent L1 voters</h3>
          <span className="c">VoteCast addresses · Etherscan</span>
        </div>
        <div style={{ display: "grid", gap: "0.5rem", padding: "1rem" }}>
          {recentVotes.map((vote) => (
            <div key={`${vote.voter}-${vote.l1LogIndex}`} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <AddressEtherscanLink
                address={vote.voter}
                content={truncateHashString(vote.voter, 6, 4)}
                title="View voter address on Etherscan"
              />
              <span style={{ color: vote.support ? "#22c55e" : "#ef4444" }}>
                {vote.support ? "+" : "−"}{formatStake(vote.amount, stakingAssetDecimals, 2)}
              </span>
            </div>
          ))}
          {votes.length === 0 ? <div className="empty-state">no voter rows</div> : null}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Indexed activity</h3>
          <span className="c">proposal signals + stake votes</span>
        </div>
        <div style={{ display: "grid", gap: "0.75rem", padding: "1rem" }}>
          <DetailRow label="Signal events" value={fmtNum(signals.length)} />
          <DetailRow label="Vote events" value={fmtNum(votes.length)} />
          <DetailRow label="Vote time span" value={voteSpanMs > 0 ? formatDuration(voteSpanMs) : votes.length > 1 ? "same block" : "—"} />
          <DetailRow
            label="Latest L1 tx"
            value={
              <TxEtherscanLink
                txHash={latestActivityTransactionHash ?? undefined}
                content={latestActivityTransactionHash ? truncateHashString(latestActivityTransactionHash, 8, 6) : "—"}
                title="View latest governance activity transaction on Etherscan"
              />
            }
          />
        </div>
      </div>
    </div>
  );
};

const DetailRow: FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
    <span className="lbl">{label}</span>
    <span style={{ fontFamily: "var(--mono)", textAlign: "right" }}>{value}</span>
  </div>
);

const EmptyProposalState: FC<{ isLoading: boolean }> = ({ isLoading }) => (
  <div className="panel">
    <div className="panel-head"><h3>Governance proposal concept</h3></div>
    <div className="empty-state" style={{ padding: "2rem", textAlign: "center" }}>
      {isLoading ? "loading governance proposals…" : "no governance proposals are available yet"}
    </div>
  </div>
);

export const GovernanceProposalDetailPage: FC = () => {
  const { payloadAddress = "" } = useParams({ strict: false });
  const { data: proposals, isLoading: proposalsLoading } = useGovernanceProposals({ limit: 100 });
  const selectedProposal = useMemo(() => {
    if (!proposals || proposals.length === 0) {
      return undefined;
    }
    const routeAddress = payloadAddress.toLowerCase();
    return proposals.find(
      (proposal) =>
        proposal.payloadAddress.toLowerCase() === routeAddress ||
        proposal.originalPayloadAddress?.toLowerCase() === routeAddress,
    );
  }, [payloadAddress, proposals]);

  const proposalId = selectedProposal?.proposalId ?? "";
  const { data: proposalDetail } = useGovernanceProposal(proposalId);
  const proposal = proposalDetail ?? selectedProposal;
  const { data: votes, isLoading: votesLoading } = useGovernanceProposalVotes(proposalId, { limit: 100 });
  const { data: signals, isLoading: signalsLoading } = useGovernanceProposalSignals(proposalId, { limit: 100 });
  const { data: chainInfo } = useChainInfo();

  const stakingAssetDecimals = chainInfo?.stakingAssetDecimals ?? 18;
  const stakingAssetSymbol = getStakingAssetSymbol(chainInfo?.stakingAssetSymbol);
  const sortedVotes = useMemo(
    () => [...(votes ?? [])].sort((a, b) => a.l1BlockTimestamp.getTime() - b.l1BlockTimestamp.getTime()),
    [votes],
  );
  const sortedSignals = useMemo(
    () => [...(signals ?? [])].sort((a, b) => a.l1BlockTimestamp.getTime() - b.l1BlockTimestamp.getTime()),
    [signals],
  );

  return (
    <Shell active="governance">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "governance", to: "/governance" },
          { label: "proposal", active: true },
        ]}
        comment={`exploratory governance proposal detail · ${truncateHashString(payloadAddress, 8, 6)}`}
      />

      {!proposal ? (
        <EmptyProposalState isLoading={proposalsLoading} />
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          <ProposalHero
            proposal={proposal}
            stakingAssetDecimals={stakingAssetDecimals}
            stakingAssetSymbol={stakingAssetSymbol}
          />

          {(votesLoading || signalsLoading) ? <span className="sub">loading activity…</span> : null}

          <LifecycleTimeline proposal={proposal} />

          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "minmax(0, 1.35fr) minmax(260px, 0.65fr)",
            }}
          >
            <VoteHistoryChart
              votes={sortedVotes}
              stakingAssetDecimals={stakingAssetDecimals}
              stakingAssetSymbol={stakingAssetSymbol}
            />
            <SignalRoundChart signals={sortedSignals} />
          </div>

          <ProposalDetailsGrid
            proposal={proposal}
            votes={sortedVotes}
            signals={sortedSignals}
            stakingAssetDecimals={stakingAssetDecimals}
            stakingAssetSymbol={stakingAssetSymbol}
          />
        </div>
      )}
    </Shell>
  );
};
