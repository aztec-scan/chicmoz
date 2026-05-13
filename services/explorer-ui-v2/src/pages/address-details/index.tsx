import { Link, useParams } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { PublicCallRequestsTable } from "~/components/data/public-call-requests-table";
import { TokenEtherscanLink } from "~/components/common";
import {
  usePublicCallRequestsBySender,
  useContractInstanceBalance,
  useContractInstanceBalanceHistory,
  useChainInfo,
} from "~/hooks/api";
import {
  ageStr,
  fmtNum,
  formatFees,
  getFeeJuiceSymbol,
  truncateHashString,
} from "~/lib/utils";

type Tab = "calls" | "balance";

export const AddressDetailsPage: FC = () => {
  const { address = "" } = useParams({ strict: false });

  const { data: publicCallRequests, isLoading, error } = usePublicCallRequestsBySender(address);
  const { data: balance } = useContractInstanceBalance(address);
  const { data: history } = useContractInstanceBalanceHistory(address);
  const { data: chainInfo } = useChainInfo();

  const [tab, setTab] = useState<Tab>("calls");

  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;

  const balanceValue =
    balance?.balance !== undefined && balance.balance !== null
      ? formatFees(balance.balance, feeJuiceDecimals)
      : "—";

  const maxBal = history?.length
    ? Number(history.reduce((m, h) => (h.balance > m ? h.balance : m), history[0].balance))
    : 0;

  const latest = history?.[history.length - 1];
  const prev24 = history?.[Math.max(0, history.length - 25)];
  const delta = latest && prev24 ? latest.balance - prev24.balance : 0n;
  const deltaAbs = delta < 0n ? -delta : delta;
  const deltaValue = formatFees(deltaAbs, feeJuiceDecimals);

  const stats = useMemo(() => {
    const calls = publicCallRequests ?? [];
    return {
      totalCalls: calls.length,
      uniqueContracts: new Set(calls.map((c) => c.contractAddress)).size,
      staticCalls: calls.filter((c) => c.isStaticCall).length,
    };
  }, [publicCallRequests]);

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
          <div className="sub">
            {delta === 0n
              ? "no change · 24h"
              : delta > 0n
                ? `+${deltaValue} · 24h`
                : `-${deltaValue} · 24h`}
          </div>
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
            onClick={() => setTab("calls")}
          >
            Public calls
            <span className="c">{stats.totalCalls}</span>
          </button>
          <button
            className={tab === "balance" ? "on" : ""}
            onClick={() => setTab("balance")}
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

        {/* Tab: Fee Juice balance + history */}
        {tab === "balance" && (
          <>
            {/* Sparkbar */}
            <div className="balance-block">
              <div className="balance-big">
                {balanceValue}
                {balance?.balance !== undefined && (
                  <TokenEtherscanLink
                    symbol={feeJuiceSymbol}
                    address={feeJuiceAddress}
                    className="u"
                  />
                )}
              </div>
              <div className="balance-sub">
                {delta === 0n
                  ? "no change · 24h"
                  : delta > 0n
                    ? `+${deltaValue} · 24h`
                    : `-${deltaValue} · 24h`}{" "}
                · {history?.length ?? 0} snapshots
              </div>
              {history && history.length > 1 && maxBal > 0 && (
                <>
                  <div className="spark">
                    {history.map((b, i) => (
                      <div
                        key={i}
                        className="bar"
                        style={{ height: `${(Number(b.balance) / maxBal) * 100}%` }}
                        title={`${formatFees(b.balance, feeJuiceDecimals)} ${feeJuiceSymbol} · ${ageStr(b.timestamp)}`}
                      />
                    ))}
                  </div>
                  <div className="spark-axis">
                    <span>oldest</span>
                    <span>·</span>
                    <span>now</span>
                  </div>
                </>
              )}
            </div>

            {/* Balance history table */}
            <div className="hist-head">
              <div>Balance ({feeJuiceSymbol})</div>
              <div>Tx</div>
              <div className="right">Timestamp</div>
              <div className="right">Age</div>
            </div>
            {(history ?? [])
              .slice()
              .reverse()
              .map((h, i) => (
                <div key={i} className="hist-row">
                  <span className="num" style={{ textAlign: "left", color: "var(--ink-1)" }}>
                    {formatFees(h.balance, feeJuiceDecimals)}
                    <TokenEtherscanLink
                      symbol={feeJuiceSymbol}
                      address={feeJuiceAddress}
                      className="u"
                    />
                  </span>
                  <span className="hash">
                    {h.sourceTxHash ? (
                      <Link to="/tx-effects/$hash" params={{ hash: h.sourceTxHash }}>
                        {truncateHashString(h.sourceTxHash, 8, 6)}
                      </Link>
                    ) : (
                      <span style={{ color: "var(--ink-3)" }}>—</span>
                    )}
                  </span>
                  <span className="num">
                    {new Date(h.timestamp).toISOString().slice(0, 19).replace("T", " ")}
                  </span>
                  <span className="age">{ageStr(h.timestamp)}</span>
                </div>
              ))}
            {(!history || history.length === 0) && (
              <div className="empty-state">no fee juice balance history</div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
};
