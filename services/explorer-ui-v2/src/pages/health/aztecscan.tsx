import {
  type ChicmozL2RpcNodeError,
  type PublicChicmozL2RpcNode,
} from "@chicmoz-pkg/types";
import { type FC, useMemo } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { useChainErrors, useRpcNodes } from "~/hooks/api";
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

/** Deduplicate by rpcNodeName, keeping the most recently seen. */
const dedupeRpcNodes = (
  rows: PublicChicmozL2RpcNode[] | undefined,
): PublicChicmozL2RpcNode[] => {
  const list = [...(rows ?? [])].sort(
    (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
  );
  const seen = new Set<string>();
  return list.filter((n) => {
    if (seen.has(n.rpcNodeName)) {return false;}
    seen.add(n.rpcNodeName);
    return true;
  });
};

const errorsForRpcNode = (
  all: ChicmozL2RpcNodeError[] | undefined,
  rpcNode: PublicChicmozL2RpcNode,
): ChicmozL2RpcNodeError[] => {
  if (!all) {return [];}
  return all.filter((e) => e.rpcNodeName === rpcNode.rpcNodeName);
};

const unmatchedErrors = (
  all: ChicmozL2RpcNodeError[] | undefined,
  rpcNodes: PublicChicmozL2RpcNode[],
): ChicmozL2RpcNodeError[] => {
  if (!all) {return [];}
  const names = new Set(rpcNodes.map((n) => n.rpcNodeName));
  return all.filter((e) => !names.has(e.rpcNodeName));
};

const RpcNodeCard: FC<{
  rpcNode: PublicChicmozL2RpcNode;
  errors: ChicmozL2RpcNodeError[];
}> = ({ rpcNode, errors }) => {
  const now = Date.now();
  const recent1h = errors.filter(
    (e) => now - e.lastSeenAt.getTime() < ONE_HOUR,
  );
  const critical5m = errors.filter(
    (e) => now - e.lastSeenAt.getTime() < FIVE_MIN,
  );
  const totalOccurrences = errors.reduce((s, e) => s + e.count, 0);

  return (
    <div className="panel rpc-node-card">
      <div className="panel-head">
        <h3>{rpcNode.rpcNodeName}</h3>
        <div className="rpc-node-meta">
          <span>
            last seen <em>{ageStr(rpcNode.lastSeenAt.getTime())}</em>
          </span>
          <span className="chip">node {rpcNode.nodeVersion}</span>
          <span className="chip">rollup v{rpcNode.rollupVersion.toString()}</span>
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
          no errors detected for this rpc node
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
  const { data: rpcNodesRaw } = useRpcNodes();

  const rpcNodes = useMemo(() => dedupeRpcNodes(rpcNodesRaw), [rpcNodesRaw]);
  const orphanErrors = useMemo(
    () => unmatchedErrors(chainErrors, rpcNodes),
    [chainErrors, rpcNodes],
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
        comment="api · indexer · websocket · rpc nodes"
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
          <div className="kicker">RPC nodes tracked</div>
          <div className="big">{fmtNum(rpcNodes.length)}</div>
          <div className="sub">deduplicated by name</div>
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

      {rpcNodes.length === 0 ? (
        <div className="panel">
          <div className="panel-head">
            <h3>RPC node health</h3>
          </div>
          <div className="empty-state">no rpc node data currently available</div>
        </div>
      ) : (
        rpcNodes.map((n) => (
          <RpcNodeCard
            key={n.rpcNodeName}
            rpcNode={n}
            errors={errorsForRpcNode(chainErrors, n)}
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
