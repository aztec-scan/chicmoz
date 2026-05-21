import { type UiBlockStatusFilter } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import {
  HashCell,
  Pagination,
  StatusPill,
  TokenEtherscanLink,
} from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useAverageFees,
  useAverageTxsPerBlock,
  useBlocksByNativeStatus,
  useChainInfo,
  useLatestBlock,
  useL2TipsHealth,
  usePaginatedTableBlocks,
} from "~/hooks/api";
import { useSortableTable } from "~/hooks/use-sortable-table";
import { blockStatusToDisplay } from "~/lib/block-status";
import { ageStr, fmtNum, formatFees, getFeeJuiceSymbol } from "~/lib/utils";

type SortKey = "height" | "txEffectsLength" | "timestamp";
type StatusFilter = "all" | UiBlockStatusFilter;

const PAGE_SIZE = 20;
const statusFilters: StatusFilter[] = [
  "all",
  "proposed",
  "checkpointed",
  "proven",
  "finalized",
  "unknown",
  "orphaned",
];

export const BlocksPage: FC = () => {
  const { data: latestBlock } = useLatestBlock();
  const { data: blocksByNativeStatus } = useBlocksByNativeStatus();
  const { data: tipsHealth } = useL2TipsHealth();

  const { sortKey, sortDir, toggleSort, sortArrow } =
    useSortableTable<SortKey>("height");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const backendStatusFilter = statusFilter === "all" ? undefined : statusFilter;

  const { data: blocks } = usePaginatedTableBlocks(
    page,
    PAGE_SIZE,
    backendStatusFilter,
  );
  const { data: chainInfo } = useChainInfo();
  const { data: averageFees } = useAverageFees();
  const { data: averageTxsPerBlock } = useAverageTxsPerBlock();
  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;

  const sortedBlocks = useMemo(() => {
    const rows = blocks ?? [];
    return [...rows].sort((a, b) => {
      const av = Number(a[sortKey]);
      const bv = Number(b[sortKey]);
      const d = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "asc" ? d : -d;
    });
  }, [blocks, sortKey, sortDir]);

  const latestHeight = latestBlock ? Number(latestBlock.height) : 0;
  const proposedTipHeight = tipsHealth?.tips.proposed.number ?? latestHeight;
  const provenTipHeight = tipsHealth?.tips.proven.block.number;
  const finalizedTipHeight = tipsHealth?.tips.finalized.block.number;
  const provenHead = blocksByNativeStatus?.find((b) => {
    const display = blockStatusToDisplay(b.nativeStatus, !!b.orphan);
    return display === "proven" || display === "finalized";
  });
  const finalized = blocksByNativeStatus?.find(
    (b) => blockStatusToDisplay(b.nativeStatus, !!b.orphan) === "finalized",
  );

  // totalPages is only meaningful for the unfiltered "all" view.
  const totalPages =
    backendStatusFilter === undefined && latestHeight
      ? Math.max(1, Math.ceil(latestHeight / PAGE_SIZE))
      : undefined;

  // In filtered views we don't know the total. Disable "next" when the
  // current page is short (i.e. we've reached the end of the filter set).
  const hasMore =
    totalPages !== undefined || (blocks ? blocks.length === PAGE_SIZE : true);

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
            {provenTipHeight !== undefined
              ? `#${fmtNum(provenTipHeight)}`
              : provenHead
                ? `#${fmtNum(Number(provenHead.height))}`
                : "—"}
          </div>
          <div className="sub" style={{ color: "var(--green)" }}>
            {provenTipHeight !== undefined
              ? `${proposedTipHeight - provenTipHeight} behind proposed`
              : provenHead
                ? `${latestHeight - Number(provenHead.height)} behind tip`
                : "—"}
          </div>
        </div>
        <div className="mc">
          <div className="lbl">Finalized head</div>
          <div className="val">
            {finalizedTipHeight !== undefined
              ? `#${fmtNum(finalizedTipHeight)}`
              : finalized
                ? `#${fmtNum(Number(finalized.height))}`
                : "—"}
          </div>
          <div className="sub">native finalized tip</div>
        </div>
        <div className="mc">
          <div className="lbl">Avg fees</div>
          <div className="val">
            {averageFees ? formatFees(averageFees, feeJuiceDecimals) : "—"}
            <TokenEtherscanLink
              symbol={feeJuiceSymbol}
              address={feeJuiceAddress}
              className="u"
            />
          </div>
          <div className="sub">non-orphan blocks</div>
        </div>
        <div className="mc">
          <div className="lbl">Avg txs / block</div>
          <div className="val">
            {averageTxsPerBlock ?? "—"}
            <span className="u">tx</span>
          </div>
          <div className="sub">non-orphan blocks</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            All blocks<span className="c">· page {page + 1}</span>
          </h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="filter-group">
              {statusFilters.map((s) => (
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
              ))}
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
          <div className="right">Coinbase</div>
          <div
            className="sortable right"
            onClick={() => toggleSort("timestamp")}
          >
            Age{sortArrow("timestamp")}
          </div>
        </div>
        <div>
          {sortedBlocks.map((b) => {
            const status = blockStatusToDisplay(b.nativeStatus, b.orphan);
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
                <HashCell value={b.blockHash} />
                <span className="num">{b.txEffectsLength}</span>
                <span className="status-cell">
                  <StatusPill status={status} />
                </span>
                {b.coinbase ? (
                  <HashCell value={b.coinbase} className="right" />
                ) : (
                  <span className="hash right">—</span>
                )}
                <span className="age">{ageStr(ts)}</span>
              </Link>
            );
          })}
          {(!blocks || sortedBlocks.length === 0) && (
            <div className="empty-state">
              {blocks ? "no blocks found" : "loading blocks..."}
            </div>
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          hasMore={hasMore}
          onPageChange={(n) => setPage(n)}
        />
      </div>
    </Shell>
  );
};
