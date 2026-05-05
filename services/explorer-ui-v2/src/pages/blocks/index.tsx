import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { Pagination, StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useBlocksByFinalizationStatus,
  useLatestBlock,
  usePaginatedTableBlocks,
} from "~/hooks/api";
import { useSortableTable } from "~/hooks/use-sortable-table";
import { blockStatusToDisplay } from "~/lib/block-status";
import { ageStr, fmtNum, truncateHashString } from "~/lib/utils";

type StatusFilter = "all" | "proposed" | "proven" | "finalized" | "orphaned";
type SortKey = "height" | "txEffectsLength" | "timestamp";

const PAGE_SIZE = 20;

export const BlocksPage: FC = () => {
  const { data: latestBlock } = useLatestBlock();
  const { data: blocksByStatus } = useBlocksByFinalizationStatus();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { sortKey, sortDir, toggleSort, sortArrow } =
    useSortableTable<SortKey>("height");
  const [page, setPage] = useState(0);

  const { data: blocks } = usePaginatedTableBlocks(page, PAGE_SIZE);

  const filtered = useMemo(() => {
    let rows = blocks ?? [];
    if (statusFilter !== "all") {
      rows = rows.filter(
        (b) => blockStatusToDisplay(b.blockStatus) === statusFilter,
      );
    }
    return [...rows].sort((a, b) => {
      const av = Number(a[sortKey]);
      const bv = Number(b[sortKey]);
      const d = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "asc" ? d : -d;
    });
  }, [blocks, statusFilter, sortKey, sortDir]);

  const latestHeight = latestBlock ? Number(latestBlock.height) : 0;
  const provenHead = blocksByStatus?.find(
    (b) => blockStatusToDisplay(b.finalizationStatus) === "proven",
  );
  const finalized = blocksByStatus?.find(
    (b) => blockStatusToDisplay(b.finalizationStatus) === "finalized",
  );

  // We page server-side at PAGE_SIZE at a time; totalPages is best-effort.
  const totalPages = latestHeight
    ? Math.max(1, Math.ceil(latestHeight / PAGE_SIZE))
    : 1;

  return (
    <Shell active="blocks">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "blocks", active: true },
        ]}
        comment="/api/l2/blocks · live tail + range scan"
      />

      <div className="meta-strip">
        <div className="mc">
          <div className="lbl">Latest height</div>
          <div className="val">#{fmtNum(latestHeight)}</div>
          <div className="sub">tip</div>
        </div>
        <div className="mc">
          <div className="lbl">Proven head</div>
          <div className="val">
            {provenHead ? `#${fmtNum(Number(provenHead.height))}` : "—"}
          </div>
          <div className="sub" style={{ color: "var(--green)" }}>
            {provenHead ? `${latestHeight - Number(provenHead.height)} behind tip` : "—"}
          </div>
        </div>
        <div className="mc">
          <div className="lbl">Finalized head</div>
          <div className="val">
            {finalized ? `#${fmtNum(Number(finalized.height))}` : "—"}
          </div>
          <div className="sub">L1-anchored</div>
        </div>
        <div className="mc">
          <div className="lbl">Page size</div>
          <div className="val">
            {PAGE_SIZE}
            <span className="u">blocks</span>
          </div>
          <div className="sub">from server</div>
        </div>
        <div className="mc">
          <div className="lbl">Rows shown</div>
          <div className="val">{filtered.length}</div>
          <div className="sub">after filter</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            All blocks<span className="c">· page {page + 1}</span>
          </h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="filter-group">
              {(["all", "proposed", "proven", "finalized", "orphaned"] as StatusFilter[]).map(
                (s) => (
                  <button
                    key={s}
                    className={statusFilter === s ? "on" : ""}
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(0);
                    }}
                  >
                    {s}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="table-head blocks-cols">
          <div className="sortable" onClick={() => toggleSort("height")}>
            Height{sortArrow("height")}
          </div>
          <div>Hash</div>
          <div
            className="sortable right"
            onClick={() => toggleSort("txEffectsLength")}
          >
            Txs{sortArrow("txEffectsLength")}
          </div>
          <div className="right">Status</div>
          <div className="right">Size</div>
          <div className="right">—</div>
          <div
            className="sortable right"
            onClick={() => toggleSort("timestamp")}
          >
            Age{sortArrow("timestamp")}
          </div>
        </div>
        <div>
          {filtered.map((b) => {
            const status = blockStatusToDisplay(b.blockStatus);
            const ts = Number(b.timestamp);
            return (
              <Link
                key={b.blockHash}
                className="trow blocks-cols"
                to="/blocks/$blockNumber"
                params={{ blockNumber: String(b.height) }}
              >
                <span className="h">
                  <span className="pfx">#</span>
                  {fmtNum(Number(b.height))}
                </span>
                <span className="hash">{truncateHashString(b.blockHash, 12, 10)}</span>
                <span className="num">{b.txEffectsLength}</span>
                <span className="status-cell">
                  <StatusPill status={status} />
                </span>
                <span className="num">—</span>
                <span className="num">—</span>
                <span className="age">{ageStr(ts)}</span>
              </Link>
            );
          })}
          {(!blocks || filtered.length === 0) && (
            <div className="empty-state">
              {blocks ? "no blocks match filter" : "loading blocks…"}
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
