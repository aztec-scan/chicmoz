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

type L1DepositRef = {
  amount: bigint;
  l1TxHash?: string | null;
  l1Sender?: string | null;
  secretHash: string;
};

type TimelineEntry = {
  kind: "snapshot";
  ts: number;
  balance: bigint;
  sourceTxHash?: string;
  feeRecipient?: string | null;
  spent: bigint | null;
  blockNumber?: bigint;
  /** Populated when this snapshot's balance increase matches an L1 deposit. */
  deposit: L1DepositRef | null;
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

  // Build snapshot timeline (newest-first) with L1 deposits merged into matching balance-increase rows.
  const timeline = useMemo((): TimelineEntry[] => {
    // Index deposits by amount so we can match them to balance increases.
    const depositByAmount = new Map<string, L1DepositRef>();
    for (const d of deposits ?? []) {
      const key = d.amount.toString();
      // Keep the earliest deposit for a given amount (closest to L2 arrival).
      if (!depositByAmount.has(key)) {
        depositByAmount.set(key, {
          amount: d.amount,
          l1TxHash: d.l1TransactionHash,
          l1Sender: d.l1Sender,
          secretHash: d.secretHash,
        });
      }
    }

    const entries: TimelineEntry[] = [];
    const reversed = (history ?? []).slice().reverse();

    for (let i = 0; i < reversed.length; i++) {
      const h = reversed[i];
      let spent: bigint | null = null;
      if (i < reversed.length - 1) {
        // spent = prev snapshot balance minus this snapshot balance.
        // positive = fees paid, negative = balance increase.
        spent = reversed[i + 1].balance - h.balance;
      }

      // If balance increased, try to match an L1 deposit of the same amount.
      let deposit: L1DepositRef | null = null;
      if (spent !== null && spent < 0n) {
        deposit = depositByAmount.get((-spent).toString()) ?? null;
      }

      entries.push({
        kind: "snapshot",
        ts: h.timestamp,
        balance: h.balance,
        sourceTxHash: h.sourceTxHash,
        feeRecipient: h.feeRecipient,
        spent,
        blockNumber: h.blockNumber,
        deposit,
      });
    }

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

        {/* Tab: Fee Juice — balance history with L1 deposits merged into received rows */}
        {tab === "balance" && (
          <>
            <div className="hist-head">
              <div>Balance ({feeJuiceSymbol})</div>
              <div>Spent / received</div>
              <div>Ref</div>
              <div className="right">Timestamp</div>
            </div>
            {pagedTimeline.length > 0 ? (
              <>
                {pagedTimeline.map((entry, i) => {
                  const { balance: bal, sourceTxHash, feeRecipient, spent, ts, blockNumber, deposit } = entry;

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
                    const label = deposit ? "L1 deposit" : "L2 top-up";
                    changeEl = (
                      <span>
                        <span style={{ color: "var(--green)" }}>+{formatFees(-spent, feeJuiceDecimals)}</span>
                        <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>{label}</span>
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
                      {/* Ref — block number + optional L1 deposit info or feeRecipient */}
                      <span className="hash">
                        {blockNumber !== undefined ? (
                          <Link to="/blocks/$blockNumber" params={{ blockNumber: blockNumber.toString() }}>
                            Block {blockNumber.toString()}
                          </Link>
                        ) : sourceTxHash ? (
                          <Link to="/tx-effects/$hash" params={{ hash: sourceTxHash }}>
                            {truncateHashString(sourceTxHash, 8, 6)}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                        {/* L1 deposit: show L1 tx + from as subline */}
                        {deposit && (
                          <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>
                            {deposit.l1TxHash ? (
                              <>
                                {"L1 "}
                                <TxEtherscanLink
                                  txHash={deposit.l1TxHash}
                                  content={truncateHashString(deposit.l1TxHash, 8, 6)}
                                  title={`secret hash: ${deposit.secretHash}`}
                                />
                              </>
                            ) : (
                              "L1 deposit"
                            )}
                            {deposit.l1Sender && (
                              <>
                                {" from "}
                                <EtherscanAddressLink
                                  endpoint={`/address/${deposit.l1Sender}`}
                                  content={truncateHashString(deposit.l1Sender, 6, 4)}
                                  title={deposit.l1Sender}
                                  showExternalLinkIcon={false}
                                />
                              </>
                            )}
                          </span>
                        )}
                        {/* Fee payment: show feeRecipient as subline */}
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
