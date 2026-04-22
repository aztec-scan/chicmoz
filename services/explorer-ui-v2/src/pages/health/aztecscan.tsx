import {
  type ChicmozL2RpcNodeError,
  type ChicmozL2Sequencer,
} from "@chicmoz-pkg/types";
import { type FC, useMemo } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { useChainErrors, useSequencers } from "~/hooks/api";
import {
  type ComponentHealthStatus,
  useSystemHealth,
} from "~/hooks/use-system-health";
import { ageStr, fmtNum } from "~/lib/utils";
import { HealthTabs } from "./tabs";

const STATUS_LABEL: Record<ComponentHealthStatus, string> = {
  UP: "UP",
  UNHEALTHY: "UNHEALTHY",
  DOWN: "DOWN",
};

const STATUS_TONE: Record<ComponentHealthStatus, string> = {
  UP: "ok",
  UNHEALTHY: "warn",
  DOWN: "down",
};

const ONE_HOUR = 60 * 60 * 1_000;
const FIVE_MIN = 5 * 60 * 1_000;

/** Deduplicate sequencers by rpcUrl, keeping the most recently seen. */
const dedupeSequencers = (
  rows: ChicmozL2Sequencer[] | undefined,
): ChicmozL2Sequencer[] => {
  const list = [...(rows ?? [])].sort(
    (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
  );
  const seen = new Set<string>();
  return list.filter((s) => {
    const key = s.rpcUrl ?? s.enr;
    if (seen.has(key)) {return false;}
    seen.add(key);
    return true;
  });
};

const errorsForSequencer = (
  all: ChicmozL2RpcNodeError[] | undefined,
  sequencer: ChicmozL2Sequencer,
): ChicmozL2RpcNodeError[] => {
  if (!all) {return [];}
  return all.filter(
    (e) =>
      (sequencer.rpcUrl && e.rpcUrl === sequencer.rpcUrl) ||
      (sequencer.rpcNodeName && e.rpcNodeName === sequencer.rpcNodeName),
  );
};

const unmatchedErrors = (
  all: ChicmozL2RpcNodeError[] | undefined,
  sequencers: ChicmozL2Sequencer[],
): ChicmozL2RpcNodeError[] => {
  if (!all) {return [];}
  const rpcUrls = new Set(
    sequencers.map((s) => s.rpcUrl).filter(Boolean) as string[],
  );
  const names = new Set(
    sequencers.map((s) => s.rpcNodeName).filter(Boolean) as string[],
  );
  return all.filter((e) => {
    const u = e.rpcUrl;
    const n = e.rpcNodeName;
    const matched =
      (u !== undefined && rpcUrls.has(u)) ||
      (n !== undefined && names.has(n));
    return !matched;
  });
};

const SequencerCard: FC<{
  sequencer: ChicmozL2Sequencer;
  errors: ChicmozL2RpcNodeError[];
}> = ({ sequencer, errors }) => {
  const now = Date.now();
  const recent1h = errors.filter(
    (e) => now - e.lastSeenAt.getTime() < ONE_HOUR,
  );
  const critical5m = errors.filter(
    (e) => now - e.lastSeenAt.getTime() < FIVE_MIN,
  );
  const totalOccurrences = errors.reduce((s, e) => s + e.count, 0);
  const name = sequencer.rpcNodeName ?? "Unknown sequencer";

  return (
    <div className="panel sequencer-card">
      <div className="panel-head">
        <h3>{name}</h3>
        <div className="sequencer-meta">
          <span>
            last seen <em>{ageStr(sequencer.lastSeenAt.getTime())}</em>
          </span>
          <span className="chip">node {sequencer.nodeVersion}</span>
          <span className="chip">rollup v{sequencer.rollupVersion.toString()}</span>
        </div>
      </div>
      <div className="stats-strip inner">
        <div className="sc">
          <div className="lbl">Total errors</div>
          <div className="val">{fmtNum(errors.length)}</div>
          <div className="sub">seen by indexer</div>
        </div>
        <div className="sc">
          <div className="lbl">Recent · 1h</div>
          <div
            className="val"
            style={{
              color: recent1h.length > 0 ? "#c99800" : "var(--ink-1)",
            }}
          >
            {fmtNum(recent1h.length)}
          </div>
          <div className="sub">within the last hour</div>
        </div>
        <div className="sc">
          <div className="lbl">Critical · 5m</div>
          <div
            className="val"
            style={{
              color: critical5m.length > 0 ? "var(--red)" : "var(--ink-1)",
            }}
          >
            {fmtNum(critical5m.length)}
          </div>
          <div className="sub">within the last 5 minutes</div>
        </div>
        <div className="sc">
          <div className="lbl">Occurrences</div>
          <div className="val">{fmtNum(totalOccurrences)}</div>
          <div className="sub">sum of all reports</div>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="empty-state" style={{ color: "var(--green)" }}>
          no errors detected for this sequencer
        </div>
      ) : (
        <div className="events-list">
          {errors.slice(0, 8).map((e, i) => (
            <div key={`${e.name}-${i}`} className="event">
              <span className="type err">err</span>
              <span className="body">
                {e.name}
                <br />
                <span className="mute">{e.message}</span>
              </span>
              <span className="age">{ageStr(e.lastSeenAt.getTime())}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AztecscanHealthPage: FC = () => {
  const system = useSystemHealth();
  const { data: chainErrors } = useChainErrors();
  const { data: sequencersRaw } = useSequencers();

  const sequencers = useMemo(
    () => dedupeSequencers(sequencersRaw),
    [sequencersRaw],
  );
  const orphanErrors = useMemo(
    () => unmatchedErrors(chainErrors, sequencers),
    [chainErrors, sequencers],
  );

  const overall = system.systemHealth.health;
  const heroTone = STATUS_TONE[overall];
  const heroLabel = STATUS_LABEL[overall];

  return (
    <Shell active="health">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "health", to: "/health" },
          { label: "aztecscan", active: true },
        ]}
        comment="api · indexer · websocket · sequencers"
      />

      <HealthTabs active="aztecscan" />

      <div className="hero-strip">
        <div className={`hero-cell status-${heroTone}`}>
          <div className="kicker">Aztec-Scan is</div>
          <div className={`big ${heroTone}`}>
            <span className={`hc-dot ${heroTone === "ok" ? "" : heroTone}`} />
            {heroLabel}
          </div>
          <div className="sub">{system.systemHealth.reason}</div>
        </div>
        <div className="hero-cell">
          <div className="kicker">Sequencers tracked</div>
          <div className="big">{fmtNum(sequencers.length)}</div>
          <div className="sub">deduplicated by rpcUrl</div>
        </div>
        <div className="hero-cell">
          <div className="kicker">Chain errors</div>
          <div className="big">{fmtNum(chainErrors?.length ?? 0)}</div>
          <div className="sub">across all sources</div>
        </div>
      </div>

      <div className="stats-strip">
        {system.components.map((c) => (
          <div className="sc" key={c.componentId}>
            <div className="lbl">{c.componentId}</div>
            <div
              className="val"
              style={{
                color:
                  c.health === "UP"
                    ? "var(--green)"
                    : c.health === "UNHEALTHY"
                      ? "#c99800"
                      : "var(--red)",
              }}
            >
              {STATUS_LABEL[c.health]}
            </div>
            <div className="sub" title={c.evaluationDetails}>
              {c.description}
            </div>
          </div>
        ))}
      </div>

      {sequencers.length === 0 ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Sequencer health</h3>
          </div>
          <div className="empty-state">no sequencer data currently available</div>
        </div>
      ) : (
        sequencers.map((s) => (
          <SequencerCard
            key={s.enr}
            sequencer={s}
            errors={errorsForSequencer(chainErrors, s)}
          />
        ))
      )}

      {orphanErrors.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <h3>
              Unmatched errors
              <span className="tag">{orphanErrors.length}</span>
            </h3>
          </div>
          <div className="events-list">
            {orphanErrors.slice(0, 10).map((e, i) => (
              <div key={i} className="event">
                <span className="type err">err</span>
                <span className="body">
                  <span style={{ color: "var(--ink-3)" }}>
                    [{e.rpcNodeName ?? e.rpcUrl ?? "unknown"}]
                  </span>{" "}
                  {e.name}
                  <br />
                  <span className="mute">{e.message}</span>
                </span>
                <span className="age">{ageStr(e.lastSeenAt.getTime())}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
};
