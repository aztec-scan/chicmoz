import { Link, useParams } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { PublicCallRequestsTable } from "~/components/data/public-call-requests-table";
import { EtherscanAddressLink, Pagination, TokenEtherscanLink, TxEtherscanLink } from "~/components/common";
import {
  usePublicCallRequestsBySender,
  useContractInstanceBalance,
  useContractInstanceBalanceHistory,
  useChainInfo,
  useL1FeeJuicePortalDepositsByAddress,
} from "~/hooks/api";
import {
  ageStr,
  fmtNum,
  formatFees,
  getFeeJuiceSymbol,
  truncateHashString,
} from "~/lib/utils";

type Tab = "calls" | "balance";
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 25;

type TimelineEntry =
  | { kind: "snapshot"; ts: number; balance: bigint; sourceTxHash?: string; feeRecipient?: string | null; spent: bigint | null }
  | { kind: "deposit"; ts: number; amount: bigint; l1TxHash?: string | null; l1Sender?: string | null; secretHash: string; isFinalized: boolean };

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
  const { data: deposits } = useL1FeeJuicePortalDepositsByAddress(address);

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

  // Build merged timeline: balance snapshots (newest-first) + L1 deposits, sorted by timestamp desc.
  const timeline = useMemo((): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];

    // Snapshot entries with per-row spent delta
    const reversed = (history ?? []).slice().reverse();
    for (let i = 0; i < reversed.length; i++) {
      const h = reversed[i];
      let spent: bigint | null = null;
      if (i < reversed.length - 1) {
        // spent = prev snapshot balance - this snapshot balance
        // positive = fees paid, negative = top-up
        spent = reversed[i + 1].balance - h.balance;
      }
      entries.push({ kind: "snapshot", ts: h.timestamp, balance: h.balance, sourceTxHash: h.sourceTxHash, feeRecipient: h.feeRecipient, spent });
    }

    // Deposit entries
    for (const d of deposits ?? []) {
      const ts = d.l1BlockTimestamp ? Number(d.l1BlockTimestamp) : 0;
      entries.push({
        kind: "deposit",
        ts,
        amount: d.amount,
        l1TxHash: d.l1TransactionHash,
        l1Sender: d.l1Sender,
        secretHash: d.secretHash,
        isFinalized: d.isFinalized,
      });
    }

    // Sort newest first; deposits with ts=0 go to the end
    entries.sort((a, b) => {
      if (a.ts === 0 && b.ts === 0) return 0;
      if (a.ts === 0) return 1;
      if (b.ts === 0) return -1;
      return b.ts - a.ts;
    });

    return entries;
  }, [history, deposits]);

  const totalPages = Math.max(1, Math.ceil(timeline.length / PAGE_SIZE));
  const pagedTimeline = timeline.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
            <span className="c">{timeline.length}</span>
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

        {/* Tab: Fee Juice timeline — balance updates + L1 deposits merged */}
        {tab === "balance" && (
          <>
            <div className="hist-head">
              <div>Balance ({feeJuiceSymbol})</div>
              <div>Spent / received</div>
              <div>Tx / ref</div>
              <div className="right">Timestamp</div>
            </div>
            {pagedTimeline.length > 0 ? (
              <>
                {pagedTimeline.map((entry, i) => {
                  if (entry.kind === "deposit") {
                    return (
                      <div key={`dep-${i}`} className="hist-row">
                        {/* Balance col — no resulting balance available for deposits */}
                        <span className="num" style={{ textAlign: "left", color: "var(--ink-3)" }}>
                          {"— "}
                          <TokenEtherscanLink symbol={feeJuiceSymbol} address={feeJuiceAddress} className="u" />
                        </span>
                        {/* Spent / received */}
                        <span>
                          <span style={{ color: "var(--green)", fontWeight: 500 }}>
                            +{formatFees(entry.amount, feeJuiceDecimals)}
                          </span>
                          <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>L1 deposit</span>
                        </span>
                        {/* Ref — L1 tx + sender */}
                        <span className="hash">
                          {entry.l1TxHash ? (
                            <TxEtherscanLink
                              txHash={entry.l1TxHash}
                              content={truncateHashString(entry.l1TxHash, 8, 6)}
                              title={`secret hash: ${entry.secretHash}`}
                            />
                          ) : (
                            <span style={{ color: "var(--ink-3)" }}>—</span>
                          )}
                          {entry.l1Sender && (
                            <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>
                              {"from "}
                              <EtherscanAddressLink
                                endpoint={`/address/${entry.l1Sender}`}
                                content={truncateHashString(entry.l1Sender, 6, 4)}
                                title={entry.l1Sender}
                                showExternalLinkIcon={false}
                              />
                            </span>
                          )}
                        </span>
                        {/* Timestamp */}
                        <span className="age">
                          {entry.ts ? (
                            <span title={ageStr(entry.ts)}>
                              {new Date(entry.ts).toISOString().replace("T", " ").slice(0, 19)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--ink-3)" }}>—</span>
                          )}
                        </span>
                      </div>
                    );
                  }

                  // Fee payment / balance update row
                  const { balance: bal, sourceTxHash, feeRecipient, spent, ts } = entry;
                  let changeEl: React.ReactNode;
                  if (spent === null || spent === 0n) {
                    changeEl = <span style={{ color: "var(--ink-3)" }}>—</span>;
                  } else if (spent > 0n) {
                    changeEl = (
                      <span>
                        <span style={{ color: "var(--red)" }}>−{formatFees(spent, feeJuiceDecimals)}</span>
                        <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>L2 fee paid</span>
                      </span>
                    );
                  } else {
                    changeEl = (
                      <span>
                        <span style={{ color: "var(--green)" }}>+{formatFees(-spent, feeJuiceDecimals)}</span>
                        <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>L2 top-up</span>
                      </span>
                    );
                  }

                  return (
                    <div key={`snap-${i}`} className="hist-row">
                      {/* Balance */}
                      <span className="num" style={{ textAlign: "left", color: "var(--ink-1)" }}>
                        {formatFees(bal, feeJuiceDecimals)}
                        {" "}
                        <TokenEtherscanLink symbol={feeJuiceSymbol} address={feeJuiceAddress} className="u" />
                      </span>
                      {/* Spent / received */}
                      <span className="num" style={{ textAlign: "left" }}>{changeEl}</span>
                      {/* Tx ref */}
                      <span className="hash">
                        {sourceTxHash ? (
                          <Link to="/tx-effects/$hash" params={{ hash: sourceTxHash }}>
                            {truncateHashString(sourceTxHash, 8, 6)}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                        {feeRecipient && spent !== null && spent > 0n && (
                          <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>
                            {"to "}
                            <Link to="/address/$address" params={{ address: feeRecipient }}>
                              {truncateHashString(feeRecipient, 6, 4)}
                            </Link>
                          </span>
                        )}
                      </span>
                      {/* Timestamp */}
                      <span className="age" style={{ textAlign: "right" }}>
                        <span title={ageStr(ts)}>
                          {new Date(ts).toISOString().replace("T", " ").slice(0, 19)}
                        </span>
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
              <div className="empty-state">no fee juice history</div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
};
