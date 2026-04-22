import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { Pagination, StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useAverageFees,
  useLatestTableTxEffects,
  usePendingTxs,
  useTotalTxEffects,
  useTotalTxEffectsLast24h,
} from "~/hooks/api";
import { ageStr, fmtNum, formatFees, truncateHashString } from "~/lib/utils";

type Filter = "mined" | "pending";
const PAGE_SIZE = 20;

export const TxsPage: FC = () => {
  // Read `filter` from URL without coupling to a typed search schema — the
  // router plugin will happily preserve it and this keeps the route config lean.
  const initialFilter = (() => {
    if (typeof window === "undefined") {return "mined" as Filter;}
    const p = new URLSearchParams(window.location.search);
    return (p.get("filter") as Filter) || "mined";
  })();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [page, setPage] = useState(0);

  const { data: mined } = useLatestTableTxEffects();
  const { data: pending } = usePendingTxs();
  const { data: totalTxEffects } = useTotalTxEffects();
  const { data: txEffects24h } = useTotalTxEffectsLast24h();
  const { data: averageFees } = useAverageFees();

  const rows = useMemo(() => {
    if (filter === "pending") {return pending ?? [];}
    return mined ?? [];
  }, [filter, mined, pending]);

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const avgFee = averageFees ? formatFees(averageFees, 18, 5) : null;

  return (
    <Shell active="txs">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "tx-effects", active: true },
        ]}
        comment="/api/l2/tx-effects + /api/l2/txs"
      />

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total tx-effects</div>
          <div className="val">{fmtNum(totalTxEffects)}</div>
          <div className="sub">cumulative</div>
        </div>
        <div className="sc">
          <div className="lbl">Last 24h</div>
          <div className="val">{fmtNum(txEffects24h)}</div>
          <div className="sub">mined</div>
        </div>
        <div className="sc">
          <div className="lbl">Pending</div>
          <div className="val">{fmtNum(pending?.length ?? 0)}</div>
          <div className="sub">in mempool</div>
        </div>
        <div className="sc">
          <div className="lbl">Avg fee</div>
          <div className="val">
            {avgFee ?? "—"}
            <span className="u">FJ</span>
          </div>
          <div className="sub">from stats</div>
        </div>
      </div>

      <div className="tabs-pill" style={{ marginBottom: 16 }}>
        <button
          className={filter === "mined" ? "on" : ""}
          onClick={() => {
            setFilter("mined");
            setPage(0);
          }}
        >
          Mined<span className="c">{fmtNum(mined?.length ?? 0)}</span>
        </button>
        <button
          className={filter === "pending" ? "on" : ""}
          onClick={() => {
            setFilter("pending");
            setPage(0);
          }}
        >
          Pending<span className="c">{fmtNum(pending?.length ?? 0)}</span>
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            {filter === "mined" ? (
              <>
                Mined tx-effects
                <span className="c">· {paged.length} of {fmtNum(rows.length)}</span>
              </>
            ) : (
              <>
                Pending mempool<span className="c">· {fmtNum(rows.length)}</span>
              </>
            )}
          </h3>
        </div>

        <div className="table-head txs-cols">
          <div>Tx hash</div>
          <div className="right">{filter === "pending" ? "Fee payer" : "Block"}</div>
          <div className="right">Fee (FJ)</div>
          <div className="right">Status</div>
          <div className="right">Age</div>
        </div>
        <div>
          {filter === "mined" &&
            paged.map((t) => {
              // UiTxEffectTable — timestamp is already ms, transactionFee is
              // a bigint-as-decimal-string in 18-decimal fee-juice units.
              const row = t as (typeof paged)[number] & {
                txHash: `0x${string}`;
                blockNumber: bigint;
                transactionFee: string | number | bigint;
                timestamp: number;
              };
              const ts = Number(row.timestamp);
              return (
                <Link
                  key={row.txHash}
                  className="trow txs-cols"
                  to="/tx-effects/$hash"
                  params={{ hash: row.txHash }}
                >
                  <span className="hash">{truncateHashString(row.txHash, 14, 12)}</span>
                  <span className="num">#{fmtNum(Number(row.blockNumber))}</span>
                  <span className="num">{formatFees(row.transactionFee, 18, 5)}</span>
                  <span className="status-cell">
                    <StatusPill status="mined" />
                  </span>
                  <span className="age">{ageStr(ts)}</span>
                </Link>
              );
            })}
          {filter === "pending" &&
            paged.map((t) => {
              const row = t as (typeof paged)[number] & {
                txHash: `0x${string}`;
                feePayer: string;
                birthTimestamp: number;
              };
              const ts = row.birthTimestamp;
              return (
                <Link
                  key={row.txHash}
                  className="trow txs-cols"
                  to="/tx-effects/$hash"
                  params={{ hash: row.txHash }}
                >
                  <span className="hash">{truncateHashString(row.txHash, 14, 12)}</span>
                  <span className="num">
                    {truncateHashString(row.feePayer, 8, 6)}
                  </span>
                  <span className="num">—</span>
                  <span className="status-cell">
                    <StatusPill status="pending" />
                  </span>
                  <span className="age">{ageStr(ts)}</span>
                </Link>
              );
            })}
          {paged.length === 0 && (
            <div className="empty-state">
              {filter === "mined" ? "no mined transactions yet" : "no pending transactions"}
            </div>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(n) => setPage(n)}
        />
      </div>
    </Shell>
  );
};
