import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import {
  AddressEtherscanLink,
  CopyableAddress,
  EtherscanAddressLink,
  TokenEtherscanLink,
} from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { useChainHealth } from "~/hooks/use-chain-health";
import {
  useChainErrors,
  useChainInfo,
  useFeeRecipients,
  useRpcNodes,
  useReorgs,
  useRollupVersions,
} from "~/hooks/api";
import {
  ageStr,
  fmtNum,
  formatFees,
  getFeeJuiceSymbol,
  truncateHashString,
} from "~/lib/utils";
import { BLOCK_TIME_TARGET_SECONDS } from "~/service/constants";
import { ComponentCard } from "./component-card";
import { HealthTabs } from "./tabs";

const ONE_DAY_MS = 86_400_000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

export const NetworkHealthPage: FC = () => {
  const { data: chainInfo } = useChainInfo();
  const { data: chainErrors } = useChainErrors();
  const { data: reorgs } = useReorgs();
  const { data: rollupVersions } = useRollupVersions();
  const { data: feeRecipients } = useFeeRecipients();
  const { data: rpcNodes } = useRpcNodes();
  const status = useChainHealth();
  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;
  const stakingAssetAddress =
    chainInfo?.l1ContractAddresses?.stakingAssetAddress;

  const now = Date.now();
  const errs24h = (chainErrors ?? []).filter(
    (e) => now - e.lastSeenAt.getTime() < ONE_DAY_MS,
  );
  const recentRpcNodes = (rpcNodes ?? []).filter(
    (node) => now - node.lastSeenAt.getTime() < SEVEN_DAYS_MS,
  );
  const rpcNodeCount = recentRpcNodes.length;
  const nodeVersions = Array.from(
    new Set(recentRpcNodes.map((node) => node.nodeVersion)),
  ).sort();
  const nodeVersionValue =
    nodeVersions.length === 0
      ? "—"
      : nodeVersions.length === 1
        ? nodeVersions[0]
        : `${nodeVersions.length} versions`;
  const nodeVersionSubtext =
    nodeVersions.length === 0
      ? "no RPC metadata in last 7d"
      : nodeVersions.length === 1
        ? `reported by ${rpcNodeCount} RPC node${rpcNodeCount === 1 ? "" : "s"} · last 7d`
        : `split across ${rpcNodeCount} RPC nodes · last 7d`;
  const nodeVersionTitle = nodeVersions.join("\n");

  const latestReorg = (reorgs ?? []).find(
    (r) => now - r.timestamp.getTime() < SEVEN_DAYS_MS,
  );
  const affectedComponents = status.components.filter(
    (component) => component.health !== "UP",
  );
  const renderL1ContractAddress = (
    address: string | undefined,
    title: string,
  ) => {
    if (!address) {
      return "—";
    }

    return (
      <>
        <CopyableAddress value={address} title={title} />
        <AddressEtherscanLink address={address} content="etherscan" />
      </>
    );
  };

  const heroClass =
    status.level === "ok"
      ? "status-ok"
      : status.level === "unknown"
        ? "status-unknown"
        : status.level === "unhealthy"
          ? "status-warn"
          : "status-down";
  const heroDot =
    status.level === "ok"
      ? ""
      : status.level === "unknown"
        ? "unknown"
        : status.level === "unhealthy"
          ? "warn"
          : "down";
  const heroBigClass =
    status.level === "ok"
      ? "ok"
      : status.level === "unknown"
        ? "unknown"
        : status.level === "unhealthy"
          ? "warn"
          : "down";
  const heroLabel =
    status.level === "ok"
      ? "OK"
      : status.level === "unknown"
        ? "UNKNOWN"
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
        comment="chain-info · rollup versions · reorgs · errors"
      />

      <HealthTabs active="network" />

      <div className="hero-strip">
        <div className={`hero-cell ${heroClass}`}>
          <div className="kicker">Chain status</div>
          <div className={`big ${heroBigClass}`}>
            <span className={`hc-dot ${heroDot}`} />
            {heroLabel}
          </div>
          <div className="sub">
            {status.label} · {status.reason}
          </div>
        </div>
        <div className="hero-cell">
          <div className="kicker">Latest reorg</div>
          <div className="big">
            {latestReorg ? `depth ${latestReorg.nbrOfOrphanedBlocks}` : "none"}
          </div>
          <div className="sub">
            {latestReorg
              ? `${ageStr(latestReorg.timestamp.getTime())} · #${fmtNum(Number(latestReorg.height))}`
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

      <div className="health-component-grid">
        {status.components.map((component) => (
          <ComponentCard key={component.componentId} component={component} />
        ))}
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
          <div className="lbl">Node version</div>
          <div className="val" title={nodeVersionTitle}>
            {nodeVersionValue}
          </div>
          <div className="sub">
            {nodeVersionSubtext} · <Link to="/health/aztecscan">details</Link>
          </div>
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
            {errs24h.length === 0
              ? "no errors in last 24h"
              : `${errs24h.length} in last 24h`}
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
                {chainInfo?.l1ChainId !== undefined
                  ? `ethereum · id ${chainInfo.l1ChainId}`
                  : "—"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Rollup contract</span>
              <span className="v">
                {renderL1ContractAddress(
                  chainInfo?.l1ContractAddresses?.rollupAddress,
                  "Copy rollup address",
                )}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Registry contract</span>
              <span className="v">
                {renderL1ContractAddress(
                  chainInfo?.l1ContractAddresses?.registryAddress,
                  "Copy registry address",
                )}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Inbox</span>
              <span className="v">
                {renderL1ContractAddress(
                  chainInfo?.l1ContractAddresses?.inboxAddress,
                  "Copy inbox address",
                )}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Outbox</span>
              <span className="v">
                {renderL1ContractAddress(
                  chainInfo?.l1ContractAddresses?.outboxAddress,
                  "Copy outbox address",
                )}
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
              Rollup versions<span className="tag">/api/l2/rollup-versions</span>
            </h3>
          </div>
          <div className="events-list">
            {(rollupVersions ?? []).map((version) => (
              <div key={version.rollupVersion} className="event">
                <span className={version.isCurrent ? "type info" : "type"}>
                  {version.isCurrent ? "current" : "seen"}
                </span>
                <span className="body">
                  v<strong>{version.rollupVersion}</strong>
                  <br />
                  <span className="mute">
                    first seen {version.firstSeenAt.toLocaleString()} · source{" "}
                    {version.firstSeenSource}
                  </span>
                </span>
                <span className="age">
                  last {ageStr(version.lastSeenAt.getTime())}
                </span>
              </div>
            ))}
            {(!rollupVersions || rollupVersions.length === 0) && (
              <div className="empty-state">no rollup versions observed</div>
            )}
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

      </div>
    </Shell>
  );
};
