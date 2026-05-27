import { type FC, useMemo, useState } from "react";
import { DashtecAddressLink, Pagination, ProposalAddressLink } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useGovernanceConfigurations,
  useGovernanceProposals,
  useGovernanceProposerHistory,
  useGovernanceSignals,
} from "~/hooks/api";
import { usePaginated } from "~/hooks/use-paginated";
import { PROPOSAL_STATES, type ProposalState } from "@chicmoz-pkg/types";
import { ageStr, fmtNum, formatDuration, truncateHashString } from "~/lib/utils";

const PAGE_SIZE = 20;

type TabKey = "proposals" | "signals" | "configurations" | "proposer-history";
type ProposalFilter = "all" | ProposalState;

interface TabDef {
  key: TabKey;
  label: string;
  desc: string;
}

const TABS: TabDef[] = [
  { key: "proposals", label: "Proposals", desc: "On-chain governance proposals with vote tallies and lifecycle state." },
  { key: "signals", label: "Signals", desc: "GovernanceProposer signal casts per round and payload." },
  { key: "configurations", label: "Configurations", desc: "Historical governance parameter snapshots." },
  { key: "proposer-history", label: "Proposer History", desc: "Changes to the active governance proposer address." },
];

const STATE_FILTERS: { key: ProposalFilter; label: string }[] = [
  { key: "all", label: "All" },
  ...PROPOSAL_STATES.map((s) => ({ key: s, label: s })),
];

const stateColor = (state: string): string => {
  switch (state) {
    case "Pending": return "var(--ink-3)";
    case "Active": return "#c99800";
    case "Queued": return "#60a5fa";
    case "Executable": return "#34d399";
    case "Executed": return "#22c55e";
    case "Dropped": return "#ef4444";
    default: return "var(--ink-2)";
  }
};

const fmtBigInt = (v: bigint | string | number | null | undefined): string => {
  if (v === null || v === undefined) { return "—"; }
  const n = typeof v === "bigint" ? v : BigInt(v);
  return fmtNum(n);
};

export const GovernancePage: FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("proposals");
  const [stateFilter, setStateFilter] = useState<ProposalFilter>("all");

  const { data: proposals, isLoading: proposalsLoading } = useGovernanceProposals(
    stateFilter !== "all" ? { state: stateFilter, limit: 100 } : { limit: 100 },
  );
  const { data: signals, isLoading: signalsLoading } = useGovernanceSignals({ limit: 100 });
  const { data: configurations, isLoading: configsLoading } = useGovernanceConfigurations({ limit: 100 });
  const { data: proposerHistory, isLoading: proposerLoading } = useGovernanceProposerHistory({ limit: 100 });

  // ── Proposal stats ──────────────────────────────────────────────────
  const proposalStats = useMemo(() => {
    if (!proposals) {
      return {
        total: 0,
        active: 0,
        byState: {} as Record<string, number>,
        totalYea: 0n,
        totalNay: 0n,
        avgNay: 0n,
        avgSignalingDurationMs: 0,
        hasSignalingData: false,
      };
    }
    const byState: Record<string, number> = {};
    let totalYea = 0n;
    let totalNay = 0n;
    let active = 0;
    let signalingDurationSum = 0;
    let signalingDurationCount = 0;

    for (const p of proposals) {
      byState[p.state] = (byState[p.state] ?? 0) + 1;
      totalYea += BigInt(p.summedYea);
      totalNay += BigInt(p.summedNay);

      // Active = neither dropped nor executed
      if (p.state !== "Executed" && p.state !== "Dropped") {
        active++;
      }

      // Signaling duration: time from createdAt through pendingThrough
      if (p.createdAt && p.pendingThrough) {
        const createdMs = p.createdAt.getTime();
        const pendingEndMs = p.pendingThrough.getTime();
        if (Number.isFinite(createdMs) && Number.isFinite(pendingEndMs) && pendingEndMs >= createdMs) {
          signalingDurationSum += pendingEndMs - createdMs;
          signalingDurationCount++;
        }
      }
    }

    const proposalsWithNay = proposals.filter((p) => BigInt(p.summedNay) > 0n);
    const avgNay = proposalsWithNay.length > 0
      ? totalNay / BigInt(proposalsWithNay.length)
      : 0n;

    return {
      total: proposals.length,
      active,
      byState,
      totalYea,
      totalNay,
      avgNay,
      avgSignalingDurationMs: signalingDurationCount > 0
        ? Math.round(signalingDurationSum / signalingDurationCount)
        : 0,
      hasSignalingData: signalingDurationCount > 0,
    };
  }, [proposals]);

  // ── Paged data per tab ──────────────────────────────────────────────
  const proposalPage = usePaginated(proposals ?? [], PAGE_SIZE);
  const signalPage = usePaginated(signals ?? [], PAGE_SIZE);
  const configPage = usePaginated(configurations ?? [], PAGE_SIZE);
  const proposerPage = usePaginated(proposerHistory ?? [], PAGE_SIZE);

  const currentPage =
    activeTab === "proposals" ? proposalPage :
      activeTab === "signals" ? signalPage :
        activeTab === "configurations" ? configPage :
          proposerPage;

  const isLoading =
    (activeTab === "proposals" && proposalsLoading) ||
    (activeTab === "signals" && signalsLoading) ||
    (activeTab === "configurations" && configsLoading) ||
    (activeTab === "proposer-history" && proposerLoading);

  const activeTabDef = TABS.find((t) => t.key === activeTab)!;

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    // Reset page for the target tab
    if (tab === "proposals") { proposalPage.setPage(0); }
    else if (tab === "signals") { signalPage.setPage(0); }
    else if (tab === "configurations") { configPage.setPage(0); }
    else { proposerPage.setPage(0); }
  };

  return (
    <Shell active="governance">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "governance", active: true },
        ]}
        comment="on-chain governance · proposals, signals, and configurations"
      />

      {/* Stats strip */}
      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total Proposals</div>
          <div className="val">{fmtNum(proposalStats.total)}</div>
          <div className="sub">
            {proposalStats.total > 0
              ? `${fmtNum(proposalStats.byState.Executed ?? 0)} executed`
              : "no proposals"}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Active Proposals</div>
          <div className="val">{fmtNum(proposalStats.active)}</div>
          <div className="sub">neither dropped nor executed</div>
        </div>
        <div className="sc">
          <div className="lbl">Avg Signaling Duration</div>
          <div className="val">
            {proposalStats.hasSignalingData
              ? formatDuration(proposalStats.avgSignalingDurationMs)
              : "—"}
          </div>
          <div className="sub">time in pending before voting</div>
        </div>
        <div className="sc">
          <div className="lbl">Average Nay</div>
          <div className="val">{fmtBigInt(proposalStats.avgNay)}</div>
          <div className="sub">votes against governance recommendation</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="gov-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={"gov-tab" + (activeTab === t.key ? " on" : "")}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <div className="gov-tab-desc">{activeTabDef.desc}</div>

      {/* State filter (proposals only) */}
      {activeTab === "proposals" && (
        <div className="gov-state-filter">
          {STATE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={"state-btn" + (stateFilter === f.key ? " on" : "")}
              onClick={() => { setStateFilter(f.key); proposalPage.setPage(0); }}
            >
              {f.label}
              {f.key !== "all" && proposalStats.byState[f.key] !== undefined && (
                <span className="state-count">{proposalStats.byState[f.key]}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Data panel */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            {activeTabDef.label}
            <span className="c">· {fmtNum(currentPage.totalPages > 0 ? (currentPage.paged as unknown[]).length : 0)} shown</span>
          </h3>
          <span className="live-indicator">
            <span className="dot" />
            live
          </span>
        </div>

        {isLoading ? (
          <div className="empty-state">loading…</div>
        ) : activeTab === "proposals" ? (
          <div>
            <div className="table-head gov-proposal-cols">
              <div>ID</div>
              <div>Payload</div>
              <div>Proposer</div>
              <div>State</div>
              <div className="right">Yea</div>
              <div className="right">Nay</div>
              <div className="right">Age</div>
            </div>
            {proposalPage.paged.map((p) => {
              const total = BigInt(p.summedYea) + BigInt(p.summedNay);
              const yeaPct = total > 0n ? Number((BigInt(p.summedYea) * 100n) / total) : 0;
              return (
                <div key={p.proposalId} className="trow gov-proposal-cols">
                  <span className="pid">#{p.proposalId}</span>
                  <span className="payload">
                    <ProposalAddressLink
                      content={truncateHashString(p.payloadAddress, 6, 4)}
                      payloadAddress={p.payloadAddress}
                    />
                  </span>
                  <span className="proposer">
                    {p.proposer
                      ? truncateHashString(p.proposer, 6, 4)
                      : "—"}
                  </span>
                  <span className="state-pill" style={{ color: stateColor(p.state) }}>
                    {p.state}
                  </span>
                  <span className="right vote-cell">
                    <span className="vote-bar-wrap">
                      <span
                        className="vote-bar yea"
                        style={{ width: `${yeaPct}%` }}
                      />
                      <span className="vote-label">{fmtBigInt(p.summedYea)}</span>
                    </span>
                  </span>
                  <span className="right">{fmtBigInt(p.summedNay)}</span>
                  <span className="right age">{ageStr(p.createdAt?.getTime?.() ?? 0)}</span>
                </div>
              );
            })}
            {proposalPage.paged.length === 0 && (
              <div className="empty-state">
                {proposals ? "no proposals match the current filter" : "loading…"}
              </div>
            )}
          </div>
        ) : activeTab === "signals" ? (
          <div>
            <div className="table-head gov-signal-cols">
              <div>Round</div>
              <div>Payload</div>
              <div>Signaler</div>
              <div>L1 Block</div>
              <div className="right">Age</div>
            </div>
            {signalPage.paged.map((s) => {
              const key = `${s.payloadAddress}-${s.round}-${s.l1LogIndex}`;
              return (
                <div key={key} className="trow gov-signal-cols">
                  <span className="round">#{fmtNum(s.round)}</span>
                  <span className="payload">
                    <ProposalAddressLink
                      content={truncateHashString(s.payloadAddress, 6, 4)}
                      payloadAddress={s.payloadAddress}
                    />
                  </span>
                  <span className="signaler">
                    <DashtecAddressLink
                      address={s.signaler}
                      content={truncateHashString(s.signaler, 6, 4)}
                    />
                  </span>
                  <span className="l1-block">{fmtNum(s.l1BlockNumber)}</span>
                  <span className="right age">{ageStr(s.l1BlockTimestamp?.getTime?.() ?? 0)}</span>
                </div>
              );
            })}
            {signalPage.paged.length === 0 && (
              <div className="empty-state">
                {signals ? "no signals found" : "loading…"}
              </div>
            )}
          </div>
        ) : activeTab === "configurations" ? (
          <div>
            <div className="table-head gov-config-cols">
              <div>Updated</div>
              <div>L1 Block</div>
              <div>Configuration</div>
            </div>
            {configPage.paged.map((c) => {
              const preview = JSON.stringify(c.configuration).slice(0, 120);
              return (
                <div key={c.id} className="trow gov-config-cols">
                  <span className="updated">{ageStr(c.updatedAt?.getTime?.() ?? 0)}</span>
                  <span className="l1-block">{fmtNum(c.l1BlockNumber)}</span>
                  <span className="config-preview">
                    <code>{preview}…</code>
                  </span>
                </div>
              );
            })}
            {configPage.paged.length === 0 && (
              <div className="empty-state">
                {configurations ? "no configurations found" : "loading…"}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="table-head gov-proposer-cols">
              <div>Proposer</div>
              <div>Updated</div>
              <div>L1 Block</div>
            </div>
            {proposerPage.paged.map((h) => {
              return (
                <div key={h.id} className="trow gov-proposer-cols">
                  <span className="proposer">
                    {truncateHashString(h.governanceProposerAddress, 6, 4)}
                  </span>
                  <span className="updated">{ageStr(h.updatedAt?.getTime?.() ?? 0)}</span>
                  <span className="l1-block">{fmtNum(h.l1BlockNumber)}</span>
                </div>
              );
            })}
            {proposerPage.paged.length === 0 && (
              <div className="empty-state">
                {proposerHistory ? "no proposer history found" : "loading…"}
              </div>
            )}
          </div>
        )}

        <Pagination
          page={currentPage.page}
          totalPages={currentPage.totalPages}
          onPageChange={currentPage.setPage}
        />
      </div>
    </Shell>
  );
};
