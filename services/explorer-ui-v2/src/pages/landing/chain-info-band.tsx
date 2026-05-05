import {
  type ChicmozChainInfo,
  type ChicmozL2PendingTx,
  type ChicmozL2RpcNodeError,
  type ChicmozReorg,
} from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, type ReactNode } from "react";
import { CopyableAddress } from "~/components/common";
import { ageStr, fmtNum, truncateHashString } from "~/lib/utils";
import { BLOCK_TIME_TARGET_SECONDS } from "~/service/constants";

interface Props {
  chainInfo: ChicmozChainInfo | undefined;
  pendingTxs: ChicmozL2PendingTx[] | undefined;
  reorgs: ChicmozReorg[] | undefined;
  chainErrors: ChicmozL2RpcNodeError[] | undefined;
  averageBlockTime: number | string | undefined;
  droppedTxs24h: string | undefined;
}

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

export const ChainInfoBand: FC<Props> = ({
  chainInfo,
  pendingTxs,
  reorgs,
  chainErrors,
  averageBlockTime,
  droppedTxs24h,
}) => {
  const avgSec = averageBlockTime
    ? Math.max(1, Math.round(Number(averageBlockTime) / 1000))
    : BLOCK_TIME_TARGET_SECONDS;
  const events = buildChainEvents(reorgs, chainErrors);

  return (
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
                      Math.min(...pendingTxs.map((p) => p.birthTimestamp)),
                    )}`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="lbl">Dropped 24h</div>
              <div className="big">
                {droppedTxs24h !== undefined ? fmtNum(droppedTxs24h) : "—"}
              </div>
              <div className="sub">last 24h</div>
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
  );
};
