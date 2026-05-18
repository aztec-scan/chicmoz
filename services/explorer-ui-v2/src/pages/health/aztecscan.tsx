import {
  type ChicmozL2RpcNodeError,
  type PublicChicmozL2RpcNode,
} from "@chicmoz-pkg/types";
import { type FC, useMemo } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { useChainErrors, useRpcNodes } from "~/hooks/api";
import {
  type ComponentHealth,
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

const STATUS_TONE: Record<ComponentHealthStatus, "ok" | "warn" | "down"> = {
  UP: "ok",
  UNHEALTHY: "warn",
  DOWN: "down",
};

const ONE_HOUR = 60 * 60 * 1_000;
const FIVE_MIN = 5 * 60 * 1_000;

interface StatusCopy {
  label: string;
  tone: "ok" | "warn" | "down";
  copy: string;
}

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

const statusCopy = (health: ComponentHealthStatus): StatusCopy => ({
  label: STATUS_LABEL[health],
  tone: STATUS_TONE[health],
  copy:
    health === "UP"
      ? "operational"
      : health === "UNHEALTHY"
        ? "degraded"
        : "attention required",
});

const rpcErrorIdentifiers = (error: ChicmozL2RpcNodeError): string[] =>
  [error.rpcNodeName, error.rpcUrl].filter((v): v is string => Boolean(v));

const errorsForRpcNode = (
  all: ChicmozL2RpcNodeError[] | undefined,
  rpcNode: PublicChicmozL2RpcNode,
): ChicmozL2RpcNodeError[] => {
  if (!all) {return [];}
  return all.filter((e) =>
    rpcErrorIdentifiers(e).includes(rpcNode.rpcNodeName),
  );
};

const unmatchedErrors = (
  all: ChicmozL2RpcNodeError[] | undefined,
  rpcNodes: PublicChicmozL2RpcNode[],
): ChicmozL2RpcNodeError[] => {
  if (!all) {return [];}
  const names = new Set(rpcNodes.map((n) => n.rpcNodeName));
  return all.filter(
    (e) => !rpcErrorIdentifiers(e).some((identifier) => names.has(identifier)),
  );
};

interface ComponentCardProps {
  component: ComponentHealth;
}

const ComponentCard: FC<ComponentCardProps> = ({ component }) => {
  const status = statusCopy(component.health);

  return (
    <div className={`health-component-card ${status.tone}`}>
      <div className="health-component-topline">
        <span className={`hc-dot ${status.tone === "ok" ? "" : status.tone}`} />
        <span className="status-pill-label">{status.label}</span>
      </div>
      <h3>{component.componentId}</h3>
      <p>{component.description}</p>
      <div className="health-component-detail" title={component.evaluationDetails}>
        {component.evaluationDetails || "no detail available"}
      </div>
    </div>
  );
};

interface ErrorEventProps {
  error: ChicmozL2RpcNodeError;
  index: number;
  showSource?: boolean;
}

const ErrorEvent: FC<ErrorEventProps> = ({ error, index, showSource = false }) => (
  <div key={`${error.name}-${index}`} className="event">
    <span className="type err">err</span>
    <span className="body">
      {showSource ? (
        <>
          <span style={{ color: "var(--ink-3)" }}>
            [{error.rpcNodeName ?? error.rpcUrl ?? "unknown"}]
          </span>{" "}
        </>
      ) : null}
      {error.name}
      <br />
      <span className="mute">{error.message}</span>
    </span>
    <span className="age">{ageStr(error.lastSeenAt.getTime())}</span>
  </div>
);

interface RpcNodeCardProps {
  rpcNode: PublicChicmozL2RpcNode;
  errors: ChicmozL2RpcNodeError[];
}

const RpcNodeCard: FC<RpcNodeCardProps> = ({ rpcNode, errors }) => {
  const now = Date.now();
  const recent1h = errors.filter(
    (e) => now - e.lastSeenAt.getTime() < ONE_HOUR,
  );
  const critical5m = errors.filter(
    (e) => now - e.lastSeenAt.getTime() < FIVE_MIN,
  );
  const totalOccurrences = errors.reduce((s, e) => s + e.count, 0);
  const nodeTone =
    critical5m.length > 0 ? "down" : recent1h.length > 0 ? "warn" : "ok";

  return (
    <div className="panel rpc-node-card">
      <div className="panel-head">
        <h3>
          {rpcNode.rpcNodeName}
          <span className={`health-node-status ${nodeTone}`}>
            {nodeTone === "ok" ? "clean" : nodeTone === "warn" ? "noisy" : "hot"}
          </span>
        </h3>
        <div className="rpc-node-meta">
          <span>
            last seen <em>{ageStr(rpcNode.lastSeenAt.getTime())}</em>
          </span>
          <span className="tag-chip">node {rpcNode.nodeVersion}</span>
          <span className="tag-chip">rollup v{rpcNode.rollupVersion.toString()}</span>
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
            <ErrorEvent key={`${e.name}-${i}`} error={e} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export const AztecscanHealthPage: FC = () => {
  const system = useSystemHealth();
  const {
    data: chainErrors,
    error: chainErrorsError,
    isLoading: chainErrorsLoading,
  } = useChainErrors();
  const {
    data: rpcNodesRaw,
    error: rpcNodesError,
    isLoading: rpcNodesLoading,
  } = useRpcNodes();

  const rpcNodes = useMemo(() => dedupeRpcNodes(rpcNodesRaw), [rpcNodesRaw]);
  const orphanErrors = useMemo(
    () => unmatchedErrors(chainErrors, rpcNodes),
    [chainErrors, rpcNodes],
  );

  const overall = system.systemHealth.health;
  const hero = statusCopy(overall);
  const isLoading = chainErrorsLoading || rpcNodesLoading;
  const hasDataError = !!chainErrorsError || !!rpcNodesError;
  const now = Date.now();
  const recentErrors = (chainErrors ?? []).filter(
    (e) => now - e.lastSeenAt.getTime() < ONE_HOUR,
  );
  const criticalErrors = (chainErrors ?? []).filter(
    (e) => now - e.lastSeenAt.getTime() < FIVE_MIN,
  );

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
        <div className={`hero-cell status-${hero.tone}`}>
          <div className="kicker">Aztec-Scan is</div>
          <div className={`big ${hero.tone}`}>
            <span className={`hc-dot ${hero.tone === "ok" ? "" : hero.tone}`} />
            {hero.label}
          </div>
          <div className="sub">
            {hero.copy} · {system.systemHealth.reason}
          </div>
        </div>
        <div className="hero-cell">
          <div className="kicker">RPC nodes tracked</div>
          <div className="big">{fmtNum(rpcNodes.length)}</div>
          <div className="sub">
            {isLoading ? "loading indexer inventory" : "deduplicated by name"}
          </div>
        </div>
        <div className="hero-cell">
          <div className="kicker">Errors · last hour</div>
          <div className="big">{fmtNum(recentErrors.length)}</div>
          <div className="sub">
            {fmtNum(criticalErrors.length)} critical in the last 5m
          </div>
        </div>
      </div>

      <div className="health-component-grid">
        {system.components.map((component) => (
          <ComponentCard key={component.componentId} component={component} />
        ))}
      </div>

      {hasDataError ? (
        <div className="panel health-alert-panel">
          <div className="panel-head">
            <h3>health data unavailable</h3>
          </div>
          <div className="kv-grid">
            {rpcNodesError ? (
              <div className="kv wide">
                <span className="k">RPC nodes</span>
                <span className="v">{rpcNodesError.message}</span>
              </div>
            ) : null}
            {chainErrorsError ? (
              <div className="kv wide">
                <span className="k">Chain errors</span>
                <span className="v">{chainErrorsError.message}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {rpcNodes.length === 0 ? (
        <div className="panel">
          <div className="panel-head">
            <h3>RPC node health</h3>
          </div>
          <div className="empty-state">
            {isLoading ? "loading rpc node data…" : "no rpc node data currently available"}
          </div>
        </div>
      ) : (
        <div className="health-rpc-grid">
          {rpcNodes.map((n) => (
            <RpcNodeCard
              key={n.rpcNodeName}
              rpcNode={n}
              errors={errorsForRpcNode(chainErrors, n)}
            />
          ))}
        </div>
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
              <ErrorEvent key={i} error={e} index={i} showSource />
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
};
