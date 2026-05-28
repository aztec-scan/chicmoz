import { useNavigate } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import {
  AddressEtherscanLink,
  Pagination,
  SkeletonRows,
  StatusPill,
  TokenEtherscanLink,
} from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useChainInfo,
  useL1L2Validators,
  useValidatorTotals,
} from "~/hooks/api";
import { usePaginated } from "~/hooks/use-paginated";
import { useSortableTable } from "~/hooks/use-sortable-table";
import {
  ageStr,
  fmtNum,
  formatStake,
  getStakingAssetSymbol,
  parseBigIntAsDecimal,
} from "~/lib/utils";
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
  const navigate = useNavigate();
  const { data: validators, isPending: validatorsLoading } = useL1L2Validators();
  const { data: totals } = useValidatorTotals();
  const { data: chainInfo } = useChainInfo();
  const stakingAssetDecimals = chainInfo?.stakingAssetDecimals ?? 18;
  const stakingAssetSymbol = getStakingAssetSymbol(
    chainInfo?.stakingAssetSymbol,
  );
  const stakingAssetAddress =
    chainInfo?.l1ContractAddresses?.stakingAssetAddress;

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const { sortKey, sortDir, toggleSort, sortArrow } =
    useSortableTable<SortKey>("stake");

  const filtered = useMemo(() => {
    let rows = validators ?? [];
    if (filter !== "all") {
      rows = rows.filter((v) => validatorStatusToDisplay(v.status) === filter);
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

  const { page, setPage, paged, totalPages } = usePaginated(
    filtered,
    PAGE_SIZE,
  );

  const total = totals?.total ?? validators?.length ?? 0;
  const validating =
    totals?.validating ??
    filtered.filter((v) => validatorStatusToDisplay(v.status) === "validating")
      .length;
  const nonValidating = totals?.nonValidating ?? total - validating;

  const toStake = (v: { stake: bigint | string | number }) =>
    parseBigIntAsDecimal(v.stake, stakingAssetDecimals);
  const toRawStake = (value: bigint | string | number): bigint => BigInt(value);
  // Stake aggregates are computed server-side on /totals so we don't need to
  // load every validator to render the strip. Fall back to the client-side
  // reduce only if the API hasn't populated them yet (older response cache).
  const totalStakeRaw =
    totals?.totalStake !== undefined
      ? toRawStake(totals.totalStake)
      : (validators ?? []).reduce((s, v) => s + toRawStake(v.stake), 0n);
  const validatingStakeRaw =
    totals?.validatingStake !== undefined
      ? toRawStake(totals.validatingStake)
      : (validators ?? [])
          .filter((v) => validatorStatusToDisplay(v.status) === "validating")
          .reduce((s, v) => s + toRawStake(v.stake), 0n);
  const maxStakeRaw =
    totals?.maxStake !== undefined
      ? toRawStake(totals.maxStake)
      : (validators ?? []).reduce(
          (m, v) => (toRawStake(v.stake) > m ? toRawStake(v.stake) : m),
          0n,
        );
  const avgStakeRaw = total ? totalStakeRaw / BigInt(total) : 0n;
  const totalStake =
    totals?.totalStake !== undefined
      ? parseBigIntAsDecimal(totals.totalStake, stakingAssetDecimals)
      : (validators ?? []).reduce((s, v) => s + toStake(v), 0);
  const validatingStake =
    totals?.validatingStake !== undefined
      ? parseBigIntAsDecimal(totals.validatingStake, stakingAssetDecimals)
      : (validators ?? [])
          .filter((v) => validatorStatusToDisplay(v.status) === "validating")
          .reduce((s, v) => s + toStake(v), 0);
  const maxStake =
    totals?.maxStake !== undefined
      ? parseBigIntAsDecimal(totals.maxStake, stakingAssetDecimals)
      : (validators ?? []).reduce(
          (m, v) => (toStake(v) > m ? toStake(v) : m),
          0,
        );

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
            {formatStake(totalStakeRaw, stakingAssetDecimals, 1)}
            <TokenEtherscanLink
              symbol={stakingAssetSymbol}
              address={stakingAssetAddress}
              className="u"
            />
          </div>
          <div className="sub">
            max {formatStake(maxStakeRaw, stakingAssetDecimals, 1)}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Validating stake</div>
          <div className="val">
            {formatStake(validatingStakeRaw, stakingAssetDecimals, 1)}
            <TokenEtherscanLink
              symbol={stakingAssetSymbol}
              address={stakingAssetAddress}
              className="u"
            />
          </div>
          <div className="sub" style={{ color: "var(--green)" }}>
            {totalStake
              ? `${Math.round((validatingStake / totalStake) * 100)}% of total`
              : "—"}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Avg stake</div>
          <div className="val">
            {formatStake(avgStakeRaw, stakingAssetDecimals, 1)}
            <TokenEtherscanLink
              symbol={stakingAssetSymbol}
              address={stakingAssetAddress}
              className="u"
            />
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
            [
              "all",
              "validating",
              "registered",
              "living",
              "exiting",
              "zombie",
            ] as Filter[]
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
          <div className="right sortable" onClick={() => toggleSort("stake")}>
            Stake ({stakingAssetSymbol}){sortArrow("stake")}
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
          {validatorsLoading && (
            <SkeletonRows
              count={PAGE_SIZE}
              columns="40px minmax(0,1fr) 160px 90px 90px 90px"
              cells={6}
            />
          )}
          {paged.map((v, i) => {
            const status = validatorStatusToDisplay(v.status);
            return (
              <div
                key={v.attester}
                className="trow validator-cols"
                role="link"
                tabIndex={0}
                onClick={() => {
                  void navigate({
                    to: "/validators/$attesterAddress",
                    params: { attesterAddress: v.attester },
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") {
                    return;
                  }
                  e.preventDefault();
                  void navigate({
                    to: "/validators/$attesterAddress",
                    params: { attesterAddress: v.attester },
                  });
                }}
              >
                <span className="rank">{page * PAGE_SIZE + i + 1}</span>
                <span
                  className="addr"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <AddressEtherscanLink
                    address={v.attester}
                    showExternalLinkIcon={false}
                  />
                </span>
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
                  <span className="v">
                    {formatStake(v.stake, stakingAssetDecimals, 1)}
                    <TokenEtherscanLink
                      symbol={stakingAssetSymbol}
                      address={stakingAssetAddress}
                      className="u"
                    />
                  </span>
                </span>
                <span className="status-cell">
                  <StatusPill status={status} />
                </span>
                <span className="age">{ageStr(v.firstSeenAt)}</span>
                <span className="age">{ageStr(v.latestSeenChangeAt)}</span>
              </div>
            );
          })}
          {!validatorsLoading && paged.length === 0 && (
            <div className="empty-state">
              {validators ? "no validators match" : "no validators found"}
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
