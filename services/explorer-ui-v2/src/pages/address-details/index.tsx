import { Link, useParams } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { PublicCallRequestsTable } from "~/components/data/public-call-requests-table";
import {
  EtherscanAddressLink,
  Pagination,
  TokenEtherscanLink,
  TxEtherscanLink,
} from "~/components/common";
import {
  usePublicCallRequestsBySender,
  useContractInstanceBalance,
  useContractInstanceBalanceHistory,
  useContractInstanceFpcRelationships,
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

type Tab = "calls" | "balance" | "deposits";
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 25;

type TimelineEntry = {
  ts: number;
  balance: bigint;
  sourceTxHash?: string;
  feeRecipient?: string | null;
  spent: bigint | null;
  blockNumber?: bigint;
};

export const AddressDetailsPage: FC = () => {
  const { address = "" } = useParams({ strict: false });

  const {
    data: publicCallRequests,
    isLoading,
    error,
  } = usePublicCallRequestsBySender(address);
  const { data: balance } = useContractInstanceBalance(address);
  const { data: history } = useContractInstanceBalanceHistory(address);
  const { data: fpcRelationships } = useContractInstanceFpcRelationships(address);
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
      : null;

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

  // Build pure balance-snapshot timeline (newest-first).
  const timeline = useMemo((): TimelineEntry[] => {
    const reversed = (history ?? []).slice().reverse();
    const entries: TimelineEntry[] = [];
    for (let i = 0; i < reversed.length; i++) {
      const h = reversed[i];
      let spent: bigint | null = null;
      if (i < reversed.length - 1) {
        spent = reversed[i + 1].balance - h.balance;
      }
      entries.push({
        ts: h.timestamp,
        balance: h.balance,
        sourceTxHash: h.sourceTxHash,
        feeRecipient: h.feeRecipient,
        spent,
        blockNumber: h.blockNumber,
      });
    }
    return entries;
  }, [history]);

  const totalPages = Math.max(1, Math.ceil(timeline.length / PAGE_SIZE));
  const pagedTimeline = timeline.slice(
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
            {balanceValue ?? (
              fpcRelationships && fpcRelationships.feePayers.length > 0 ? (
                <span style={{ color: "var(--ink-3)" }}>
                  via{" "}
                  {fpcRelationships.feePayers.slice(0, 3).map((fpc, i) => (
                    <span key={fpc}>
                      {i > 0 && ", "}
                      <Link
                        to="/address/$address"
                        params={{ address: fpc }}
                        className="hash"
                        style={{ fontSize: "0.85em" }}
                      >
                        {truncateHashString(fpc, 6, 4)}
                      </Link>
                    </span>
                  ))}
                  {fpcRelationships.feePayers.length > 3 && (
                    <span style={{ color: "var(--ink-3)" }}>
                      {" "}+{fpcRelationships.feePayers.length - 3} more
                    </span>
                  )}
                </span>
              ) : (
                <span
                  style={{ color: "var(--ink-3)", cursor: "help" }}
                  title="This address does not hold any Fee Juice. Fees may be paid by a Fee Paying Contract (FPC)."
                >
                  ?
                </span>
              )
            )}
            {balance?.balance !== undefined && (
              <TokenEtherscanLink
                symbol={feeJuiceSymbol}
                address={feeJuiceAddress}
                className="u"
              />
            )}
          </div>
          <div className="sub">{deltaSummary}</div>
          {fpcRelationships && fpcRelationships.sponsoredAddresses.length > 0 && (
            <div
              className="sub"
              style={{ marginTop: 6, color: "var(--ink-2)", fontSize: "0.8em" }}
            >
              Pays fees for:{" "}
              {fpcRelationships.sponsoredAddresses.slice(0, 5).map((addr, i) => (
                <span key={addr}>
                  {i > 0 && ", "}
                  <Link
                    to="/address/$address"
                    params={{ address: addr }}
                    className="hash"
                    style={{ fontSize: "0.85em" }}
                  >
                    {truncateHashString(addr, 6, 4)}
                  </Link>
                </span>
              ))}
              {fpcRelationships.sponsoredAddresses.length > 5 && (
                <span style={{ color: "var(--ink-3)" }}>
                  {" "}+{fpcRelationships.sponsoredAddresses.length - 5} more
                </span>
              )}
            </div>
          )}
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
          <button
            className={tab === "deposits" ? "on" : ""}
            onClick={() => handleTabChange("deposits")}
          >
            L1 deposits
            <span className="c">{deposits?.length ?? 0}</span>
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

        {/* Tab: Fee Juice — balance history */}
        {tab === "balance" && (
          <>
            <div className="hist-head">
              <div>Block</div>
              <div>Balance</div>
              <div>Paid/Received</div>
              <div>Tx</div>
              <div className="right">Timestamp</div>
            </div>
            {pagedTimeline.length > 0 ? (
              <>
                {pagedTimeline.map((entry, i) => {
                  const {
                    balance: bal,
                    sourceTxHash,
                    feeRecipient,
                    spent,
                    ts,
                    blockNumber,
                  } = entry;

                  let changeEl: React.ReactNode;
                  if (spent === null || spent === 0n) {
                    changeEl = <span style={{ color: "var(--ink-3)" }}>—</span>;
                  } else if (spent > 0n) {
                    changeEl = (
                      <span>
                        <span style={{ color: "var(--red)" }}>
                          −{formatFees(spent, feeJuiceDecimals)}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75em",
                            color: "var(--ink-3)",
                            marginTop: 2,
                          }}
                        >
                          L2 fee paid
                        </span>
                      </span>
                    );
                  } else {
                    changeEl = (
                      <span>
                        <span style={{ color: "var(--green)" }}>
                          +{formatFees(-spent, feeJuiceDecimals)}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75em",
                            color: "var(--ink-3)",
                            marginTop: 2,
                          }}
                        >
                          received
                        </span>
                      </span>
                    );
                  }

                  return (
                    <div key={`snap-${i}`} className="hist-row">
                      <span className="hash" style={{ textAlign: "left" }}>
                        {blockNumber !== undefined ? (
                          <Link
                            to="/blocks/$blockNumber"
                            params={{ blockNumber: blockNumber.toString() }}
                          >
                            {blockNumber.toString()}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--ink-3)" }} title="Block number not yet available">?</span>
                        )}
                      </span>
                      <span className="num" style={{ textAlign: "left" }}>
                        {formatFees(bal, feeJuiceDecimals)}{" "}
                        <TokenEtherscanLink
                          symbol={feeJuiceSymbol}
                          address={feeJuiceAddress}
                          className="u"
                        />
                      </span>
                      <span className="num" style={{ textAlign: "left" }}>
                        {changeEl}
                      </span>
                      <span className="hash">
                        {sourceTxHash ? (
                          <Link
                            to="/tx-effects/$hash"
                            params={{ hash: sourceTxHash }}
                          >
                            {truncateHashString(sourceTxHash, 8, 6)}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                        {feeRecipient && spent !== null && spent > 0n && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.75em",
                              color: "var(--ink-3)",
                              marginTop: 2,
                            }}
                          >
                            {"to "}
                            <Link
                              to="/address/$address"
                              params={{ address: feeRecipient }}
                            >
                              {truncateHashString(feeRecipient, 6, 4)}
                            </Link>
                          </span>
                        )}
                      </span>
                      <span className="age" style={{ textAlign: "right" }}>
                        <span title={ageStr(ts)}>
                          {new Date(ts)
                            .toISOString()
                            .replace("T", " ")
                            .slice(0, 19)}
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

        {/* Tab: L1 deposits */}
        {tab === "deposits" && (
          <>
            {!deposits?.length ? (
              <div className="empty-state">no L1 deposits</div>
            ) : (
              <>
                <div className="hist-head hist-head-4col">
                  <div className="left">Amount ({feeJuiceSymbol})</div>
                  <div>L1 tx</div>
                  <div>From</div>
                  <div className="right">Timestamp</div>
                </div>
                {deposits.map((d, i) => {
                  const ts = d.l1BlockTimestamp
                    ? Number(d.l1BlockTimestamp)
                    : 0;
                  return (
                    <div key={`dep-${i}`} className="hist-row hist-row-4col">
                      <span
                        className="num"
                        style={{ textAlign: "left", color: "var(--green)" }}
                      >
                        +{formatFees(d.amount, feeJuiceDecimals)}
                      </span>
                      <span className="hash">
                        {d.l1TransactionHash ? (
                          <TxEtherscanLink
                            txHash={d.l1TransactionHash}
                            content={truncateHashString(
                              d.l1TransactionHash,
                              8,
                              6,
                            )}
                            title={`secret hash: ${d.secretHash}`}
                          />
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                      </span>
                      <span className="hash">
                        {d.l1Sender ? (
                          <EtherscanAddressLink
                            endpoint={`/address/${d.l1Sender}`}
                            content={truncateHashString(d.l1Sender, 6, 4)}
                            title={d.l1Sender}
                          />
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                      </span>
                      <span className="age" style={{ textAlign: "right" }}>
                        {ts ? (
                          <span title={ageStr(ts)}>
                            {new Date(ts)
                              .toISOString()
                              .replace("T", " ")
                              .slice(0, 19)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </Shell>
  );
};
