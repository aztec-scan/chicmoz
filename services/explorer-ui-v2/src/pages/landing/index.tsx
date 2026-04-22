import { type ChicmozL2RpcNodeError, type ChicmozReorg } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, type ReactNode } from "react";
import { CopyableAddress, Countdown, StatusPill } from "~/components/common";
import { Shell } from "~/components/layout";
import {
  useAverageBlockTime,
  useAverageFees,
  useBlocksByFinalizationStatus,
  useChainErrors,
  useChainInfo,
  useLatestBlock,
  useLatestTableBlocks,
  useLatestTableTxEffects,
  usePendingTxs,
  useReorgs,
  useTotalContracts,
  useTotalContractsLast24h,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks/api";
import { blockStatusToDisplay } from "~/lib/block-status";
import { ageStr, fmtNum, formatFees, truncateHashString } from "~/lib/utils";
import { BLOCK_TIME_TARGET_SECONDS } from "~/service/constants";

// Stat endpoints now return bigint-as-decimal-string (18-decimal fee juice).
const fjAmount = (v: string | undefined) => formatFees(v);

export const Landing: FC = () => {
  const { data: latestBlock } = useLatestBlock();
  const { data: blocksByStatus } = useBlocksByFinalizationStatus();
  const { data: tableBlocks } = useLatestTableBlocks();
  const { data: tableTxs } = useLatestTableTxEffects();
  const { data: pendingTxs } = usePendingTxs();
  const { data: reorgs } = useReorgs();
  const { data: chainErrors } = useChainErrors();
  const { data: chainInfo } = useChainInfo();

  const { data: totalTxEffects } = useTotalTxEffects();
  const { data: txEffects24h } = useTotalTxEffectsLast24h();
  const { data: totalContracts } = useTotalContracts();
  const { data: contracts24h } = useTotalContractsLast24h();
  const { data: averageFees } = useAverageFees();
  const { data: averageBlockTime } = useAverageBlockTime();

  const latestTs =
    latestBlock?.header?.globalVariables?.timestamp !== undefined
      ? Number(latestBlock.header.globalVariables.timestamp)
      : Date.now();

  const latestHeight = latestBlock?.height
    ? Number(latestBlock.height)
    : undefined;
  const latestHash = latestBlock?.hash;
  const latestStatus = blockStatusToDisplay(
    latestBlock?.finalizationStatus,
    !!latestBlock?.orphan,
  );

  const statusLabelMap: Record<string, string> = {
    proposed: "proposed · awaiting proof",
    proven: "proven",
    finalized: "finalized",
    orphaned: "orphaned",
    pending: "pending",
  };

  const provenHead = blocksByStatus?.find(
    (b) =>
      blockStatusToDisplay(b.finalizationStatus, !!b.orphan) === "proven" ||
      blockStatusToDisplay(b.finalizationStatus, !!b.orphan) === "finalized",
  );
  const finalized = blocksByStatus?.find(
    (b) => blockStatusToDisplay(b.finalizationStatus, !!b.orphan) === "finalized",
  );

  const avgSec = averageBlockTime
    ? Math.max(1, Math.round(Number(averageBlockTime) / 1000))
    : BLOCK_TIME_TARGET_SECONDS;

  const blockRows = (tableBlocks ?? []).slice(0, 10);
  const txRows = (tableTxs ?? []).slice(0, 10);

  const events = buildChainEvents(reorgs, chainErrors);

  return (
    <Shell active="home">
      <div className="tip">
        <div className="tip-cell accent">
          <span className="rail" />
          <div className="kicker">
            Latest block<em>● live</em>
          </div>
          <div className="hh">
            {latestHeight !== undefined ? (
              <Link
                to="/blocks/$blockNumber"
                params={{ blockNumber: String(latestHeight) }}
              >
                <span className="pfx">#</span>
                {fmtNum(latestHeight)}
              </Link>
            ) : (
              <>
                <span className="pfx">#</span>—
              </>
            )}
          </div>
          <div className="sub">
            <div className="kv-line">
              <span className="k">hash</span>
              <span className="v">
                {latestHash && latestHeight !== undefined ? (
                  <Link
                    to="/blocks/$blockNumber"
                    params={{ blockNumber: String(latestHeight) }}
                  >
                    {truncateHashString(latestHash, 14, 12)}
                  </Link>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="kv-line">
              <span className="k">status</span>
              <span className="v">{statusLabelMap[latestStatus]}</span>
            </div>
            <div className="kv-line">
              <span className="k">age</span>
              <span className="v">{ageStr(latestTs)}</span>
            </div>
          </div>
        </div>

        <div className="tip-cell">
          <div className="kicker">Proven head</div>
          <div className="count">
            {provenHead?.height !== undefined
              ? `#${fmtNum(Number(provenHead.height))}`
              : "—"}
          </div>
          <div className="delta">
            {provenHead?.height !== undefined && latestHeight !== undefined
              ? `${Math.max(0, latestHeight - Number(provenHead.height))} blocks behind tip`
              : "awaiting proof"}
          </div>
          <div className="sub" style={{ marginTop: 14 }}>
            <div className="kv-line">
              <span className="k">finalized</span>
              <span className="v">
                {finalized?.height !== undefined
                  ? `#${fmtNum(Number(finalized.height))}`
                  : "—"}
              </span>
            </div>
            <div className="kv-line">
              <span className="k">L1 chain</span>
              <span className="v">
                ethereum · id {chainInfo?.l1ChainId ?? "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="tip-cell">
          <Countdown avgSec={avgSec} latestBlockTs={latestTs} />
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total tx-effects</div>
          <div className="val">{fmtNum(totalTxEffects)}</div>
          <div className="sub">
            <em>+{fmtNum(txEffects24h)}</em> last 24h
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Total contracts</div>
          <div className="val">{fmtNum(totalContracts)}</div>
          <div className="sub">
            <em>+{fmtNum(contracts24h)}</em> last 24h
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Avg fees</div>
          <div className="val">
            {fjAmount(averageFees)}
            <span className="u">FJ</span>
          </div>
          <div className="sub">last 100 blocks</div>
        </div>
        <div className="sc">
          <div className="lbl">Pending mempool</div>
          <div className="val">
            {fmtNum(pendingTxs?.length ?? 0)}
            <span className="u">txs</span>
          </div>
          <div className="sub">waiting for inclusion</div>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-head">
            <h3>
              Latest blocks<span className="count">· last {blockRows.length}</span>
            </h3>
            <Link to="/blocks" className="view-all">
              all blocks ↗
            </Link>
          </div>
          <div className="row-head block-cols">
            <div>Height</div>
            <div>Hash</div>
            <div style={{ textAlign: "right" }}>Txs</div>
            <div style={{ textAlign: "right" }}>Status</div>
            <div style={{ textAlign: "right" }}>Age</div>
          </div>
          <div className="rows">
            {blockRows.map((b) => {
              const status = blockStatusToDisplay(b.blockStatus);
              const ts = Number(b.timestamp);
              return (
                <Link
                  key={b.blockHash}
                  className="row row-block"
                  to="/blocks/$blockNumber"
                  params={{ blockNumber: String(b.height) }}
                >
                  <span className="h">
                    <span className="pfx">#</span>
                    {fmtNum(Number(b.height))}
                  </span>
                  <span className="hash">
                    {truncateHashString(b.blockHash, 14, 12)}
                  </span>
                  <span className="num">{b.txEffectsLength}</span>
                  <span className="status-cell">
                    <StatusPill status={status} />
                  </span>
                  <span className="age">{ageStr(ts)}</span>
                </Link>
              );
            })}
            {blockRows.length === 0 && (
              <div className="empty-state">waiting for blocks…</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>
              Latest tx-effects<span className="count">· last {txRows.length}</span>
            </h3>
            <Link to="/tx-effects" className="view-all">
              all txs ↗
            </Link>
          </div>
          <div className="row-head tx-cols">
            <div>Tx hash</div>
            <div style={{ textAlign: "right" }}>Block</div>
            <div style={{ textAlign: "right" }}>Fee (FJ)</div>
            <div style={{ textAlign: "right" }}>Age</div>
          </div>
          <div className="rows">
            {txRows.map((t) => {
              const ts = Number(t.timestamp);
              return (
                <Link
                  key={t.txHash}
                  className="row row-tx"
                  to="/tx-effects/$hash"
                  params={{ hash: t.txHash }}
                >
                  <span className="hash">{truncateHashString(t.txHash, 14, 12)}</span>
                  <span className="num">#{fmtNum(Number(t.blockNumber))}</span>
                  <span className="num">{formatFees(t.transactionFee)}</span>
                  <span className="age">{ageStr(ts)}</span>
                </Link>
              );
            })}
            {txRows.length === 0 && (
              <div className="empty-state">waiting for transactions…</div>
            )}
          </div>
        </div>
      </div>

      <div className="band">
        <div className="band-grid">
          <div className="band-cell">
            <h4>
              Chain info<span className="tag">/api/l2/info</span>
            </h4>
            <div className="kv-list">
              <div className="kv">
                <span className="k">Network</span>
                <span className="v">{chainInfo?.l2NetworkId ?? "—"}</span>
              </div>
              <div className="kv">
                <span className="k">L1 chain</span>
                <span className="v">
                  ethereum · id {chainInfo?.l1ChainId ?? "—"}
                </span>
              </div>
              <div className="kv">
                <span className="k">Rollup version</span>
                <span className="v">
                  {chainInfo?.rollupVersion !== undefined
                    ? chainInfo.rollupVersion.toString()
                    : "—"}
                </span>
              </div>
              <div className="kv">
                <span className="k">Rollup address</span>
                <span className="v">
                  <CopyableAddress
                    value={chainInfo?.l1ContractAddresses?.rollupAddress}
                    display={
                      chainInfo?.l1ContractAddresses?.rollupAddress
                        ? truncateHashString(
                            chainInfo.l1ContractAddresses.rollupAddress,
                            10,
                            8,
                          )
                        : undefined
                    }
                    title="Copy rollup address"
                  />
                </span>
              </div>
              <div className="kv">
                <span className="k">Registry</span>
                <span className="v">
                  <CopyableAddress
                    value={chainInfo?.l1ContractAddresses?.registryAddress}
                    display={
                      chainInfo?.l1ContractAddresses?.registryAddress
                        ? truncateHashString(
                            chainInfo.l1ContractAddresses.registryAddress,
                            10,
                            8,
                          )
                        : undefined
                    }
                    title="Copy registry address"
                  />
                </span>
              </div>
              <div className="kv">
                <span className="k">Target cadence</span>
                <span className="v">{avgSec}s / block</span>
              </div>
            </div>
          </div>

          <div className="band-cell">
            <h4>
              Mempool<span className="tag">/api/l2/txs</span>
            </h4>
            <div className="mempool">
              <div>
                <div className="lbl">Pending</div>
                <div className="big">{fmtNum(pendingTxs?.length ?? 0)}</div>
                <div className="sub">
                  {pendingTxs && pendingTxs.length > 0
                    ? `oldest ${ageStr(
                        Math.min(
                          ...pendingTxs.map((p) => p.birthTimestamp),
                        ),
                      )}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="lbl">Dropped 24h</div>
                <div className="big">—</div>
                <div className="sub">no bulk feed yet</div>
              </div>
            </div>
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid var(--line-soft)",
              }}
            >
              <a
                href="/tx-effects?filter=pending"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--purple)",
                  textDecoration: "none",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                view pending queue →
              </a>
            </div>
          </div>

          <div className="band-cell">
            <h4>
              Chain events<span className="tag">reorgs · errors</span>
            </h4>
            <div className="ticker">
              {events.length === 0 && (
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-3)",
                    padding: "8px 0",
                  }}
                >
                  no recent events
                </div>
              )}
              {events.slice(0, 4).map((e, i) => (
                <div key={i} className="tick-row">
                  <div>
                    <span className={`t ${e.type}`}>{e.type}</span>
                  </div>
                  <div className="d">{e.body}</div>
                  <div className="a">{ageStr(e.ts)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

interface TickerEvent {
  type: "reorg" | "orphan" | "err";
  body: ReactNode;
  ts: number;
}

const buildChainEvents = (
  reorgs: ChicmozReorg[] | undefined,
  chainErrors: ChicmozL2RpcNodeError[] | undefined,
): TickerEvent[] => {
  const events: TickerEvent[] = [];
  (reorgs ?? []).forEach((r) => {
    const ts = r.timestamp instanceof Date ? r.timestamp.getTime() : 0;
    events.push({
      type: "reorg",
      ts,
      body: (
        <>
          depth <strong>{r.nbrOfOrphanedBlocks}</strong> at{" "}
          <Link
            to="/blocks/$blockNumber"
            params={{ blockNumber: String(r.height) }}
          >
            #{fmtNum(Number(r.height))}
          </Link>
        </>
      ),
    });
  });
  (chainErrors ?? []).forEach((e) => {
    events.push({
      type: "err",
      ts: e.lastSeenAt.getTime(),
      body: `${e.rpcNodeName ?? "rpc"} · ${e.name}`,
    });
  });
  return events.sort((a, b) => b.ts - a.ts);
};
