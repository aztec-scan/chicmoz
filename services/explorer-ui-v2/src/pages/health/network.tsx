import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import {
  CopyableAddress,
  EtherscanAddressLink,
  TokenEtherscanLink,
} from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useChainErrors,
  useChainInfo,
  useFeeRecipients,
  useReorgs,
} from "~/hooks/api";
import { useSystemStatus } from "~/hooks/use-system-status";
import {
  ageStr,
  fmtNum,
  formatFees,
  getFeeJuiceSymbol,
  truncateHashString,
} from "~/lib/utils";
import { BLOCK_TIME_TARGET_SECONDS } from "~/service/constants";
import { HealthTabs } from "./tabs";

const ONE_DAY_MS = 86_400_000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

export const NetworkHealthPage: FC = () => {
  const { data: chainInfo } = useChainInfo();
  const { data: chainErrors } = useChainErrors();
  const { data: reorgs } = useReorgs();
  const { data: feeRecipients } = useFeeRecipients();
  const status = useSystemStatus();
  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;
  const stakingAssetAddress =
    chainInfo?.l1ContractAddresses?.stakingAssetAddress;

  const now = Date.now();
  const errs24h = (chainErrors ?? []).filter(
    (e) => now - e.lastSeenAt.getTime() < ONE_DAY_MS,
  );
  const reorgs7d = (reorgs ?? []).filter(
    (r) => now - r.timestamp.getTime() < SEVEN_DAYS_MS,
  );
  const maxDepth7d = reorgs7d.reduce(
    (m, r) => (r.nbrOfOrphanedBlocks > m ? r.nbrOfOrphanedBlocks : m),
    0,
  );

  // Bucket the last 7 days into per-day max-depth bins for the chart.
  // Buckets are oldest→newest so the chart reads left-to-right.
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const reorgDailyMaxDepth = Array.from({ length: 7 }, (_, i) => {
    const dayStart = todayStart.getTime() - (6 - i) * ONE_DAY_MS;
    const dayEnd = dayStart + ONE_DAY_MS;
    const inDay = reorgs7d.filter((r) => {
      const t = r.timestamp.getTime();
      return t >= dayStart && t < dayEnd;
    });
    const maxDepth = inDay.reduce(
      (m, r) => (r.nbrOfOrphanedBlocks > m ? r.nbrOfOrphanedBlocks : m),
      0,
    );
    return { dayStart, depth: maxDepth, count: inDay.length };
  });
  const chartMax = Math.max(...reorgDailyMaxDepth.map((b) => b.depth), 1);

  const heroClass =
    status.level === "ok"
      ? "status-ok"
      : status.level === "unhealthy"
        ? "status-warn"
        : "status-down";
  const heroDot =
    status.level === "ok" ? "" : status.level === "unhealthy" ? "warn" : "down";
  const heroBigClass =
    status.level === "ok"
      ? "ok"
      : status.level === "unhealthy"
        ? "warn"
        : "down";
  const heroLabel =
    status.level === "ok"
      ? "OK"
      : status.level === "unhealthy"
        ? "UNHEALTHY"
        : "DOWN";

  return (
    <Shell active="health">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "health", to: "/health" },
          { label: "network", active: true },
        ]}
        comment="chain-info · reorgs · errors · fee recipients"
      />

      <HealthTabs active="network" />

      <div className="hero-strip">
        <div className={`hero-cell ${heroClass}`}>
          <div className="kicker">Chain status</div>
          <div className={`big ${heroBigClass}`}>
            <span className={`hc-dot ${heroDot}`} />
            {heroLabel}
          </div>
          <div className="sub">{status.label} · last check just now</div>
        </div>
        <div className="hero-cell">
          <div className="kicker">Latest reorg</div>
          <div className="big">
            {reorgs?.[0] ? `depth ${reorgs[0].nbrOfOrphanedBlocks}` : "none"}
          </div>
          <div className="sub">
            {reorgs?.[0]
              ? `${ageStr(reorgs[0].timestamp.getTime())} · #${fmtNum(Number(reorgs[0].height))}`
              : "no reorgs in window"}
          </div>
        </div>
        <div className="hero-cell">
          <div className="kicker">Errors · last 24h</div>
          <div className="big">{errs24h.length}</div>
          <div className="sub">
            {errs24h.reduce(
              (s, e) => ({
                ...s,
                [e.name]: (s[e.name] ?? 0) + 1,
              }),
              {} as Record<string, number>,
            ) && `${errs24h.length} distinct error signatures`}
          </div>
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Block cadence</div>
          <div className="val">
            {BLOCK_TIME_TARGET_SECONDS}
            <span className="u">s target</span>
          </div>
          <div className="sub">network parameter</div>
        </div>
        <div className="sc">
          <div className="lbl">Rollup version</div>
          <div className="val">
            {chainInfo?.rollupVersion !== undefined
              ? chainInfo.rollupVersion.toString()
              : "—"}
          </div>
          <div className="sub">chain info</div>
        </div>
        <div className="sc">
          <div className="lbl">Reorgs · 7d</div>
          <div className="val">{reorgs7d.length}</div>
          <div className="sub">max depth {maxDepth7d}</div>
        </div>
        <div className="sc">
          <div className="lbl">Errors · 7d</div>
          <div className="val">
            {
              (chainErrors ?? []).filter(
                (e) => now - e.lastSeenAt.getTime() < SEVEN_DAYS_MS,
              ).length
            }
          </div>
          <div
            className="sub"
            style={{ color: errs24h.length === 0 ? "var(--green)" : undefined }}
          >
            {errs24h.length === 0 ? "within budget" : "above 24h budget"}
          </div>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-head">
            <h3>
              Chain info<span className="tag">/api/l2/info</span>
            </h3>
          </div>
          <div className="kv-grid">
            <div className="kv wide">
              <span className="k">Network</span>
              <span className="v">{chainInfo?.l2NetworkId ?? "—"}</span>
            </div>
            <div className="kv wide">
              <span className="k">L1 chain</span>
              <span className="v">
                ethereum · id {chainInfo?.l1ChainId ?? "—"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Rollup contract</span>
              <span className="v">
                <CopyableAddress
                  value={chainInfo?.l1ContractAddresses?.rollupAddress}
                  title="Copy rollup address"
                />
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Registry contract</span>
              <span className="v">
                <CopyableAddress
                  value={chainInfo?.l1ContractAddresses?.registryAddress}
                  title="Copy registry address"
                />
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Inbox</span>
              <span className="v">
                <CopyableAddress
                  value={chainInfo?.l1ContractAddresses?.inboxAddress}
                  title="Copy inbox address"
                />
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Outbox</span>
              <span className="v">
                <CopyableAddress
                  value={chainInfo?.l1ContractAddresses?.outboxAddress}
                  title="Copy outbox address"
                />
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Fee juice</span>
              <span className="v">
                {feeJuiceAddress ? (
                  <EtherscanAddressLink
                    content={feeJuiceAddress}
                    endpoint={`/token/${feeJuiceAddress}`}
                    title="View fee juice token on Etherscan"
                  />
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Staking asset</span>
              <span className="v">
                {stakingAssetAddress ? (
                  <EtherscanAddressLink
                    content={stakingAssetAddress}
                    endpoint={`/token/${stakingAssetAddress}`}
                    title="View staking token on Etherscan"
                  />
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>
              Reorg depth · 7d<span className="tag">max depth per day</span>
            </h3>
            <span className="mute">
              {reorgs7d.length} reorgs · max depth {maxDepth7d}
            </span>
          </div>
          <div className="reorg-chart">
            {reorgDailyMaxDepth.map((b, i) => {
              const dayLabel = new Date(b.dayStart).toLocaleDateString(
                "en-US",
                { weekday: "short" },
              );
              const heightPct = (b.depth / chartMax) * 100;
              const isToday = i === reorgDailyMaxDepth.length - 1;
              return (
                <div key={b.dayStart} className="reorg-chart-col">
                  <div className="reorg-chart-bar-wrap">
                    {b.depth > 0 && (
                      <span
                        className="reorg-chart-bar"
                        style={{ height: `${heightPct}%` }}
                        title={`depth ${b.depth} · ${b.count} reorg${b.count === 1 ? "" : "s"}`}
                      />
                    )}
                  </div>
                  <div className="reorg-chart-axis">
                    <span className={isToday ? "today" : ""}>{dayLabel}</span>
                    <span className="depth">{b.depth || "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>
              Reorgs<span className="tag">/api/l2/reorgs</span>
            </h3>
          </div>
          <div className="events-list">
            {(reorgs ?? []).slice(0, 10).map((r, i) => (
              <div key={i} className="event">
                <span className="type reorg">reorg</span>
                <span className="body">
                  depth <strong>{r.nbrOfOrphanedBlocks}</strong> at{" "}
                  <Link
                    to="/blocks/$blockNumber"
                    params={{ blockNumber: String(r.height) }}
                  >
                    #{fmtNum(Number(r.height))}
                  </Link>{" "}
                  <span className="mute">
                    · orphan {truncateHashString(r.orphanedBlockHash, 8, 6)}
                  </span>
                </span>
                <span className="age">{ageStr(r.timestamp.getTime())}</span>
              </div>
            ))}
            {(!reorgs || reorgs.length === 0) && (
              <div className="empty-state">no recent reorgs</div>
            )}
          </div>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-head">
            <h3>
              Chain errors<span className="tag">/api/l2/errors</span>
            </h3>
          </div>
          <div className="events-list">
            {(chainErrors ?? []).slice(0, 10).map((e, i) => (
              <div key={i} className="event">
                <span className="type err">err</span>
                <span className="body">
                  <span style={{ color: "var(--ink-3)" }}>
                    [{e.rpcNodeName ?? "rpc"}]
                  </span>{" "}
                  {e.name}
                  <br />
                  <span className="mute">{e.message}</span>
                </span>
                <span className="age">{ageStr(e.lastSeenAt.getTime())}</span>
              </div>
            ))}
            {(!chainErrors || chainErrors.length === 0) && (
              <div className="empty-state">no chain errors tracked</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>
              Top fee recipients
              <span className="tag">/api/l2/fee-recipients</span>
            </h3>
          </div>
          <div className="fee-head">
            <div>Address</div>
            <div className="right">Blocks</div>
            <div className="right">Fees ({feeJuiceSymbol})</div>
          </div>
          {(feeRecipients ?? []).slice(0, 10).map((r) => (
            <div key={r.l2Address} className="fee-row">
              <span className="addr">{r.l2Address}</span>
              <span className="num">{fmtNum(r.nbrOfBlocks)}</span>
              <span className="num">
                {formatFees(r.feesReceived, feeJuiceDecimals)}
                <TokenEtherscanLink
                  symbol={feeJuiceSymbol}
                  address={feeJuiceAddress}
                  className="u"
                />
              </span>
            </div>
          ))}
          {(!feeRecipients || feeRecipients.length === 0) && (
            <div className="empty-state">no fee recipient data</div>
          )}
        </div>
      </div>
    </Shell>
  );
};
