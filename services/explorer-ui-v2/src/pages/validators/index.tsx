import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { Pagination, StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { useL1L2Validators, useValidatorTotals } from "~/hooks/api";
import { usePaginated } from "~/hooks/use-paginated";
import { useSortableTable } from "~/hooks/use-sortable-table";
import { ageStr, fmtNum, parseBigIntAsDecimal } from "~/lib/utils";
import { validatorStatusToDisplay } from "~/lib/validator-status";

type Filter =
  | "all"
  | "validating"
  | "registered"
  | "living"
  | "exiting"
  | "zombie";

type SortKey = "stake" | "firstSeenAt" | "latestSeenChangeAt";

const PAGE_SIZE = 20;

export const ValidatorsPage: FC = () => {
  const { data: validators } = useL1L2Validators();
  const { data: totals } = useValidatorTotals();

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const { sortKey, sortDir, toggleSort, sortArrow } =
    useSortableTable<SortKey>("stake");

  const filtered = useMemo(() => {
    let rows = validators ?? [];
    if (filter !== "all") {
      rows = rows.filter(
        (v) => validatorStatusToDisplay(v.status) === filter,
      );
    }
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (v) =>
          v.attester.toLowerCase().includes(needle) ||
          v.proposer.toLowerCase().includes(needle),
      );
    }
    return [...rows].sort((a, b) => {
      // stake is a bigint; compare as bigint to keep precision.
      if (sortKey === "stake") {
        const d = a.stake > b.stake ? 1 : a.stake < b.stake ? -1 : 0;
        return sortDir === "asc" ? d : -d;
      }
      const av = Number(a[sortKey]);
      const bv = Number(b[sortKey]);
      const d = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "asc" ? d : -d;
    });
  }, [validators, filter, q, sortKey, sortDir]);

  const { page, setPage, paged, totalPages } = usePaginated(filtered, PAGE_SIZE);

  const total = totals?.total ?? validators?.length ?? 0;
  const validating =
    totals?.validating ??
    filtered.filter((v) => validatorStatusToDisplay(v.status) === "validating")
      .length;
  const nonValidating = totals?.nonValidating ?? total - validating;

  const toStake = (v: { stake: bigint | string | number }) =>
    parseBigIntAsDecimal(v.stake);
  const totalStake = (validators ?? []).reduce((s, v) => s + toStake(v), 0);
  const validatingStake = (validators ?? [])
    .filter((v) => validatorStatusToDisplay(v.status) === "validating")
    .reduce((s, v) => s + toStake(v), 0);
  const maxStake = (validators ?? []).reduce(
    (m, v) => (toStake(v) > m ? toStake(v) : m),
    0,
  );
  const avgStake = total ? totalStake / total : 0;

  return (
    <Shell active="validators">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "validators", active: true },
        ]}
        comment="/api/l1/l2-validators · stake + lifecycle"
      />

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total validators</div>
          <div className="val">{fmtNum(total)}</div>
          <div className="sub">
            {validating} validating · {nonValidating} other
          </div>
          {total > 0 && (
            <div className="dist-bar">
              <span
                className="validating"
                style={{ width: `${(validating / total) * 100}%` }}
              />
              <span
                className="non"
                style={{ width: `${(nonValidating / total) * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="sc">
          <div className="lbl">Total stake</div>
          <div className="val">
            {fmtNum(Math.round(totalStake))}
            <span className="u">STK</span>
          </div>
          <div className="sub">max {fmtNum(Math.round(maxStake))}</div>
        </div>
        <div className="sc">
          <div className="lbl">Validating stake</div>
          <div className="val">
            {fmtNum(Math.round(validatingStake))}
            <span className="u">STK</span>
          </div>
          <div className="sub" style={{ color: "var(--green)" }}>
            {totalStake ? `${Math.round((validatingStake / totalStake) * 100)}% of total` : "—"}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Avg stake</div>
          <div className="val">
            {avgStake.toFixed(1)}
            <span className="u">STK</span>
          </div>
          <div className="sub">across all</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div className="tabs-pill">
          {(
            ["all", "validating", "registered", "living", "exiting", "zombie"] as Filter[]
          ).map((s) => (
            <button
              key={s}
              className={filter === s ? "on" : ""}
              onClick={() => {
                setFilter(s);
                setPage(0);
              }}
            >
              {s}
              <span className="c">
                {s === "all"
                  ? total
                  : (validators ?? []).filter(
                      (v) => validatorStatusToDisplay(v.status) === s,
                    ).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Validators<span className="c">· {filtered.length} shown</span>
          </h3>
          <input
            className="search-inline"
            placeholder="filter by attester or proposer…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="table-head validator-cols">
          <div className="right">#</div>
          <div>Attester</div>
          <div
            className="right sortable"
            onClick={() => toggleSort("stake")}
          >
            Stake{sortArrow("stake")}
          </div>
          <div className="right">Status</div>
          <div
            className="right sortable"
            onClick={() => toggleSort("firstSeenAt")}
          >
            First seen{sortArrow("firstSeenAt")}
          </div>
          <div
            className="right sortable"
            onClick={() => toggleSort("latestSeenChangeAt")}
          >
            Last change{sortArrow("latestSeenChangeAt")}
          </div>
        </div>
        <div>
          {paged.map((v, i) => {
            const status = validatorStatusToDisplay(v.status);
            return (
              <Link
                key={v.attester}
                className="trow validator-cols"
                to="/validators/$attesterAddress"
                params={{ attesterAddress: v.attester }}
              >
                <span className="rank">{page * PAGE_SIZE + i + 1}</span>
                <span className="addr">{v.attester}</span>
                <span className="stakebar">
                  <span className="bar">
                    <span
                      className="fill"
                      style={{
                        width:
                          maxStake > 0
                            ? `${(toStake(v) / maxStake) * 100}%`
                            : "0%",
                      }}
                    />
                  </span>
                  <span className="v">{toStake(v).toFixed(1)}</span>
                </span>
                <span className="status-cell">
                  <StatusPill status={status} />
                </span>
                <span className="age">{ageStr(v.firstSeenAt)}</span>
                <span className="age">{ageStr(v.latestSeenChangeAt)}</span>
              </Link>
            );
          })}
          {paged.length === 0 && (
            <div className="empty-state">
              {validators ? "no validators match" : "loading validators…"}
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
