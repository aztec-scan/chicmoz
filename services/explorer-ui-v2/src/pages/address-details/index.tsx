import { Link, useParams } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { PublicCallRequestsTable } from "~/components/data/public-call-requests-table";
import { Pagination, TokenEtherscanLink } from "~/components/common";
import {
  usePublicCallRequestsBySender,
  useContractInstanceBalance,
  useContractInstanceBalanceHistory,
  useChainInfo,
} from "~/hooks/api";
import {
  fmtNum,
  formatFees,
  getFeeJuiceSymbol,
  truncateHashString,
} from "~/lib/utils";

type Tab = "calls" | "balance";
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 25;

export const AddressDetailsPage: FC = () => {
  const { address = "" } = useParams({ strict: false });

  const {
    data: publicCallRequests,
    isLoading,
    error,
  } = usePublicCallRequestsBySender(address);
  const { data: balance } = useContractInstanceBalance(address);
  const { data: history } = useContractInstanceBalanceHistory(address);
  const { data: chainInfo } = useChainInfo();

  const [tab, setTab] = useState<Tab>("calls");
  const [page, setPage] = useState(0);

  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;

  const balanceValue =
    balance?.balance !== undefined && balance.balance !== null
      ? formatFees(balance.balance, feeJuiceDecimals)
      : "—";

  // Delta summary for the stats strip tile (24h change)
  const latest = history?.[history.length - 1];
  const comparisonPoint = useMemo(() => {
    if (!history || history.length < 2 || !latest) {
      return undefined;
    }
    const cutoff = latest.timestamp - DAY_MS;
    for (let i = history.length - 2; i >= 0; i--) {
      if (history[i].timestamp <= cutoff) {
        return history[i];
      }
    }
    return history[0];
  }, [history, latest]);
  const delta =
    latest && comparisonPoint ? latest.balance - comparisonPoint.balance : 0n;
  const deltaAbs = delta < 0n ? -delta : delta;
  const deltaValue = formatFees(deltaAbs, feeJuiceDecimals);
  const deltaLabel =
    comparisonPoint && latest
      ? latest.timestamp - comparisonPoint.timestamp >= DAY_MS
        ? "24h"
        : "available history"
      : "latest snapshot";
  const deltaSummary =
    latest && comparisonPoint
      ? delta === 0n
        ? `no change · ${deltaLabel}`
        : delta > 0n
          ? `+${deltaValue} · ${deltaLabel}`
          : `-${deltaValue} · ${deltaLabel}`
      : "no history yet";

  // Per-row spent delta (newest first). Index 0 in reversed = latest snapshot.
  // spent[i] = history[n-1-i].balance - history[n-2-i].balance
  // oldest row (last in reversed) has no prior → 0n
  const reversedHistory = useMemo(() => {
    if (!history) {
      return [];
    }
    return history.slice().reverse();
  }, [history]);

  const spentPerRow = useMemo(() => {
    // reversedHistory[0] = newest, reversedHistory[last] = oldest
    // spent for row i = reversedHistory[i+1].balance - reversedHistory[i].balance
    // (how much balance dropped going from i+1 to i, i.e. previous snapshot to this one)
    return reversedHistory.map((_, i) => {
      if (i === reversedHistory.length - 1) {
        return 0n;
      } // oldest row, no prior baseline
      const prev = reversedHistory[i + 1].balance;
      const curr = reversedHistory[i].balance;
      return prev - curr; // positive = fees paid, negative = top-up
    });
  }, [reversedHistory]);

  const totalPages = Math.max(1, Math.ceil(reversedHistory.length / PAGE_SIZE));
  const pagedHistory = reversedHistory.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );
  const pagedSpent = spentPerRow.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const stats = useMemo(() => {
    const calls = publicCallRequests ?? [];
    return {
      totalCalls: calls.length,
      uniqueContracts: new Set(calls.map((c) => c.contractAddress)).size,
      staticCalls: calls.filter((c) => c.isStaticCall).length,
    };
  }, [publicCallRequests]);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setPage(0);
  };

  return (
    <Shell>
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "address", active: true },
          { label: truncateHashString(address, 10, 8), active: true },
        ]}
        comment="L2 account activity"
      />

      <div className="detail-header">
        <div className="kicker">L2 address · account</div>
        <h1 className="hash-sized">{address}</h1>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Fee Juice balance</div>
          <div className="val">
            {balanceValue}
            {balance?.balance !== undefined && (
              <TokenEtherscanLink
                symbol={feeJuiceSymbol}
                address={feeJuiceAddress}
                className="u"
              />
            )}
          </div>
          <div className="sub">{deltaSummary}</div>
        </div>
        <div className="sc">
          <div className="lbl">Total calls</div>
          <div className="val">{fmtNum(stats.totalCalls)}</div>
          <div className="sub">as msg sender</div>
        </div>
        <div className="sc">
          <div className="lbl">Unique contracts</div>
          <div className="val">{fmtNum(stats.uniqueContracts)}</div>
          <div className="sub">contracts called</div>
        </div>
        <div className="sc">
          <div className="lbl">Static calls</div>
          <div className="val">{fmtNum(stats.staticCalls)}</div>
          <div className="sub">read-only</div>
        </div>
      </div>

      <div className="panel">
        <div className="tabs">
          <button
            className={tab === "calls" ? "on" : ""}
            onClick={() => handleTabChange("calls")}
          >
            Public calls
            <span className="c">{stats.totalCalls}</span>
          </button>
          <button
            className={tab === "balance" ? "on" : ""}
            onClick={() => handleTabChange("balance")}
          >
            Fee Juice
            <span className="c">{history?.length ?? 0}</span>
          </button>
        </div>

        {/* Tab: Public calls */}
        {tab === "calls" && (
          <>
            {isLoading ? (
              <div className="empty-state">loading address activity…</div>
            ) : error ? (
              <div className="empty-state" style={{ color: "var(--red)" }}>
                failed to load: {error.message}
              </div>
            ) : (
              <PublicCallRequestsTable data={publicCallRequests} omitSender />
            )}
          </>
        )}

        {/* Tab: Fee Juice balance history */}
        {tab === "balance" && (
          <>
            <div className="hist-head">
              <div>Balance ({feeJuiceSymbol})</div>
              <div>Spent</div>
              <div>Tx</div>
              <div className="right">Timestamp</div>
              <div className="right">Age</div>
            </div>
            {pagedHistory.length > 0 ? (
              <>
                {pagedHistory.map((h, i) => {
                  const spent = pagedSpent[i];
                  const isOldest =
                    page * PAGE_SIZE + i === reversedHistory.length - 1;
                  let spentEl: React.ReactNode;
                  if (isOldest || spent === 0n) {
                    spentEl = <span style={{ color: "var(--ink-3)" }}>—</span>;
                  } else if (spent > 0n) {
                    // fees paid — balance went down
                    spentEl = (
                      <span style={{ color: "var(--red)" }}>
                        -{formatFees(spent, feeJuiceDecimals)}
                      </span>
                    );
                  } else {
                    // top-up — balance went up
                    spentEl = (
                      <span style={{ color: "var(--green)" }}>
                        +{formatFees(-spent, feeJuiceDecimals)}
                      </span>
                    );
                  }

                  return (
                    <div key={i} className="hist-row">
                      <span
                        className="num"
                        style={{ textAlign: "left", color: "var(--ink-1)" }}
                      >
                        {formatFees(h.balance, feeJuiceDecimals)}
                        <TokenEtherscanLink
                          symbol={feeJuiceSymbol}
                          address={feeJuiceAddress}
                          className="u"
                        />
                      </span>
                      <span className="num" style={{ textAlign: "left" }}>
                        {spentEl}
                      </span>
                      <span className="hash">
                        {h.sourceTxHash ? (
                          <Link
                            to="/tx-effects/$hash"
                            params={{ hash: h.sourceTxHash }}
                          >
                            {truncateHashString(h.sourceTxHash, 8, 6)}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                      </span>
                      <span className="num">
                        {new Date(h.timestamp)
                          .toISOString()
                          .slice(0, 19)
                          .replace("T", " ")}
                      </span>
                    </div>
                  );
                })}
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <div className="empty-state">no fee juice balance history</div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
};
