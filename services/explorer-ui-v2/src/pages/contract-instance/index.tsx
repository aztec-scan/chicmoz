import { getContractInstanceVerificationStatus } from "@chicmoz-pkg/types";
import { Link, useParams } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import {
  DetailEmptyState,
  DetailField,
  EtherscanAddressLink,
  HashCell,
  L2AddressLink,
  TokenEtherscanLink,
  TxEtherscanLink,
  VerificationPillLink,
} from "~/components/common";
import { L2ToL1MsgsTable } from "~/components/data/l2-to-l1-msgs-table";
import { PublicCallRequestsTable } from "~/components/data/public-call-requests-table";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useContractInstance,
  useContractInstanceBalance,
  useContractInstanceBalanceHistory,
  useChainInfo,
  useL2ToL1MsgsByContract,
  usePublicCallRequestsByContract,
  useL1FeeJuicePortalDepositsByAddress,
} from "~/hooks/api";
import {
  ageStr,
  formatFees,
  getFeeJuiceSymbol,
  truncateHashString,
} from "~/lib/utils";

type Tab = "balance" | "history" | "calls" | "l2l1" | "deposits";

type TimelineEntry = {
  ts: number;
  balance: bigint;
  sourceTxHash?: string;
  feeRecipient?: string | null;
  spent: bigint | null;
  blockNumber?: bigint;
};

export const ContractInstancePage: FC = () => {
  const { address = "" } = useParams({ strict: false });
  const { data: instance, isLoading } = useContractInstance(address);
  const { data: balance } = useContractInstanceBalance(address);
  const { data: history } = useContractInstanceBalanceHistory(address);
  const { data: chainInfo } = useChainInfo();
  const { data: publicCalls } = usePublicCallRequestsByContract(address);
  const { data: l2ToL1Msgs } = useL2ToL1MsgsByContract(address);
  const { data: deposits } = useL1FeeJuicePortalDepositsByAddress(address);

  const [tab, setTab] = useState<Tab>("balance");

  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;
  const balanceValue =
    balance === undefined
      ? "—"
      : formatFees(balance?.balance ?? 0n, feeJuiceDecimals);

  // Build pure balance-snapshot timeline (newest-first).
  const timeline = useMemo((): TimelineEntry[] => {
    const reversed = (history ?? []).slice().reverse();
    const entries: TimelineEntry[] = [];
    for (let i = 0; i < reversed.length; i++) {
      const h = reversed[i];
      const spent = i < reversed.length - 1 ? reversed[i + 1].balance - h.balance : null;
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

  const stubCrumbs = [
    { label: "aztec-scan", to: "/" },
    { label: "contracts", to: "/contracts" },
    { label: "instances" },
    { label: truncateHashString(address, 8, 6), active: true },
  ];
  if (isLoading) {
    return (
      <DetailEmptyState
        active="contracts"
        crumbs={stubCrumbs}
        message="loading instance…"
      />
    );
  }
  if (!instance) {
    return (
      <DetailEmptyState
        active="contracts"
        crumbs={stubCrumbs}
        message="instance not found"
      />
    );
  }

  const verificationStatus = getContractInstanceVerificationStatus(instance);
  const className =
    instance.artifactContractName ??
    instance.standardContractType ??
    "Contract";

  const maxBal = history?.length
    ? Number(
        history.reduce(
          (m, h) => (h.balance > m ? h.balance : m),
          history[0].balance,
        ),
      )
    : 0;

  const latest = history?.[history.length - 1];
  const prev24 = history?.[Math.max(0, history.length - 25)];
  const delta = latest && prev24 ? latest.balance - prev24.balance : 0n;
  const deltaAbs = delta < 0n ? -delta : delta;
  const deltaValue = formatFees(deltaAbs, feeJuiceDecimals);

  return (
    <Shell active="contracts">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "contracts", to: "/contracts" },
          { label: "instances" },
          { label: truncateHashString(address, 10, 8), active: true },
        ]}
        comment={`/api/l2/contract-instances/${truncateHashString(address, 6, 4)}`}
      />

      <div className="detail-header">
        <div className="kicker">Contract instance</div>
        <h1 className="sans">
          {className}{" "}
          <span
            style={{
              color: "var(--ink-3)",
              fontFamily: "var(--mono)",
              fontSize: 14,
            }}
          >
            · instance
          </span>
        </h1>
        <div className="subhash">{instance.address}</div>
        <div className="meta-row">
          <VerificationPillLink
            kind="artifact"
            verified={verificationStatus.artifactVerified}
          />
          <VerificationPillLink
            kind="source"
            verified={verificationStatus.sourceVerified}
          />
          <VerificationPillLink
            kind="deployment"
            verified={verificationStatus.deploymentVerified}
          />
          <VerificationPillLink
            kind="aztecScanNotes"
            verified={verificationStatus.aztecScanNotesListed}
          />
          <span className="meta-line">
            class{" "}
            <Link
              to="/contracts/classes/$id/versions/$version"
              params={{
                id: instance.contractClassId,
                version: String(instance.version),
              }}
            >
              {truncateHashString(instance.contractClassId, 8, 6)}
            </Link>{" "}
            v{instance.version}
          </span>
          <span className="meta-line">
            fee balance {balanceValue}
            <TokenEtherscanLink
              symbol={feeJuiceSymbol}
              address={feeJuiceAddress}
              className="u"
            />{" "}
            ·{" "}
            {delta === 0n
              ? "no change · 24h"
              : delta > 0n
                ? `▲ ${deltaValue} · 24h`
                : `▼ ${deltaValue} · 24h`}
          </span>
        </div>
      </div>

      {instance.aztecScanNotes && (
        <div className="panel">
          <div className="panel-head">
            <h3>
              AztecScan notes
              <span className="tag">curated metadata</span>
            </h3>
            {instance.aztecScanNotes.category && (
              <span className="tag-chip tag-chip-ok">
                {instance.aztecScanNotes.category}
              </span>
            )}
          </div>
          <div className="kv-grid">
            <DetailField label="Name" width="extra-wide">
              {instance.aztecScanNotes.name}
            </DetailField>
            <DetailField label="Origin" width="extra-wide">
              {instance.aztecScanNotes.origin}
            </DetailField>
            <DetailField label="Comment" width="extra-wide">
              {instance.aztecScanNotes.comment}
            </DetailField>
            {instance.aztecScanNotes.relatedL1ContractAddresses?.length ? (
              <DetailField label="Related L1 contracts" width="extra-wide">
                <div className="stack">
                  {instance.aztecScanNotes.relatedL1ContractAddresses.map(
                    (related) =>
                      related ? (
                        <div key={`${related.address}-${related.note}`}>
                          <span className="mono">{related.address}</span>
                          <span className="mute"> · {related.note}</span>
                        </div>
                      ) : null,
                  )}
                </div>
              </DetailField>
            ) : null}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h3>
            Instance header
            <span className="tag">deployed instance</span>
          </h3>
        </div>
        <div className="kv-grid">
          <DetailField label="Address" width="extra-wide">
            {instance.address}
          </DetailField>
          <DetailField label="Contract class" width="extra-wide">
            <Link
              to="/contracts/classes/$id/versions/$version"
              params={{
                id: instance.contractClassId,
                version: String(instance.version),
              }}
            >
              {className} v{instance.version}
            </Link>{" "}
            <span className="mute">· {instance.contractClassId}</span>
          </DetailField>
          <DetailField label="Initialization hash" width="extra-wide">
            {instance.initializationHash}
          </DetailField>
          <DetailField label="Deployer" width="extra-wide">
            <L2AddressLink address={instance.deployer} truncate={false} />
          </DetailField>
          <DetailField label="Salt" width="extra-wide">
            {instance.salt}
          </DetailField>
          <DetailField label="Block hash" width="extra-wide">
            <Link
              to="/blocks/$blockNumber"
              params={{ blockNumber: instance.blockHash }}
            >
              <HashCell value={instance.blockHash} />
            </Link>
          </DetailField>
          <DetailField label="Artifact hash" width="extra-wide">
            {instance.artifactHash}
          </DetailField>
        </div>
      </div>

      {instance.deployerMetadata && (
        <div className="panel">
          <div className="panel-head">
            <h3>
              Deployer metadata
              <span className="tag">submitted metadata</span>
            </h3>
            {instance.deployerMetadata.reviewedAt && (
              <span
                className="tag-chip tag-chip-ok"
                title="Reviewed by aztec-scan"
              >
                ✓ reviewed
              </span>
            )}
          </div>
          <div className="kv-grid">
            <DetailField label="Creator" width="extra-wide">
              {instance.deployerMetadata.creatorName}
            </DetailField>
            <DetailField label="Contact" width="extra-wide">
              {instance.deployerMetadata.creatorContact}
            </DetailField>
            <DetailField label="Identifier" width="extra-wide">
              {instance.deployerMetadata.contractIdentifier}
            </DetailField>
            <DetailField label="Details" width="extra-wide">
              {instance.deployerMetadata.details}
            </DetailField>
            {instance.deployerMetadata.appUrl && (
              <DetailField label="App" width="extra-wide">
                <a
                  href={instance.deployerMetadata.appUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {instance.deployerMetadata.appUrl} ↗
                </a>
              </DetailField>
            )}
            {instance.deployerMetadata.repoUrl && (
              <DetailField label="Repository" width="extra-wide">
                <a
                  href={instance.deployerMetadata.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {instance.deployerMetadata.repoUrl} ↗
                </a>
              </DetailField>
            )}
            <DetailField label="Uploaded" width="extra-wide">
              {new Date(instance.deployerMetadata.uploadedAt)
                .toISOString()
                .slice(0, 10)}
            </DetailField>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="tabs">
          <button
            className={tab === "balance" ? "on" : ""}
            onClick={() => setTab("balance")}
          >
            Balance
          </button>
          <button
            className={tab === "history" ? "on" : ""}
            onClick={() => setTab("history")}
          >
            Balance history
            <span className="c">{timeline.length}</span>
          </button>
          <button
            className={tab === "calls" ? "on" : ""}
            onClick={() => setTab("calls")}
          >
            Public calls
            <span className="c">{publicCalls?.length ?? 0}</span>
          </button>
          <button
            className={tab === "l2l1" ? "on" : ""}
            onClick={() => setTab("l2l1")}
          >
            L2 → L1 msgs
            <span className="c">{l2ToL1Msgs?.length ?? 0}</span>
          </button>
          <button
            className={tab === "deposits" ? "on" : ""}
            onClick={() => setTab("deposits")}
          >
            L1 deposits
            <span className="c">{deposits?.length ?? 0}</span>
          </button>
        </div>
        {tab === "balance" && (
          <div className="balance-block">
            <div className="balance-big">
              {balanceValue}
              <TokenEtherscanLink
                symbol={feeJuiceSymbol}
                address={feeJuiceAddress}
                className="u"
              />
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
                      style={{
                        height: `${(Number(b.balance) / maxBal) * 100}%`,
                      }}
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
        )}
        {tab === "history" && (
          <>
            <div className="hist-head">
              <div>Balance ({feeJuiceSymbol})</div>
              <div>Spent / received</div>
              <div>Ref</div>
              <div className="right">Timestamp</div>
            </div>
            {timeline.map((entry, i) => {
              const { balance: bal, sourceTxHash, feeRecipient, spent, ts, blockNumber } = entry;

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
                    <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>received</span>
                  </span>
                );
              }

              return (
                <div key={`snap-${i}`} className="hist-row">
                  <span className="num" style={{ textAlign: "left", color: "var(--ink-1)" }}>
                    {formatFees(bal, feeJuiceDecimals)}
                    {" "}
                    <TokenEtherscanLink symbol={feeJuiceSymbol} address={feeJuiceAddress} className="u" />
                  </span>
                  <span className="num" style={{ textAlign: "left" }}>{changeEl}</span>
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
                    {feeRecipient && spent !== null && spent > 0n && (
                      <span style={{ display: "block", fontSize: "0.75em", color: "var(--ink-3)", marginTop: 2 }}>
                        {"to "}
                        <Link to="/address/$address" params={{ address: feeRecipient }}>
                          {truncateHashString(feeRecipient, 6, 4)}
                        </Link>
                      </span>
                    )}
                  </span>
                  <span className="age" style={{ textAlign: "right" }}>
                    <span title={ageStr(ts)}>
                      {new Date(ts).toISOString().replace("T", " ").slice(0, 19)}
                    </span>
                  </span>
                </div>
              );
            })}
            {timeline.length === 0 && (
              <div className="empty-state">no fee juice history</div>
            )}
          </>
        )}
        {tab === "calls" && <PublicCallRequestsTable data={publicCalls} />}
        {tab === "l2l1" && (
          <L2ToL1MsgsTable
            data={l2ToL1Msgs}
            emptyMessage="no L2 → L1 messages from this contract"
          />
        )}
        {tab === "deposits" && (
          <>
            {!(deposits?.length) ? (
              <div className="empty-state">no L1 deposits</div>
            ) : (
              <>
                <div className="hist-head">
                  <div className="right">Amount ({feeJuiceSymbol})</div>
                  <div>L1 tx</div>
                  <div>From</div>
                  <div className="right">Timestamp</div>
                </div>
                {deposits.map((d, i) => {
                  const ts = d.l1BlockTimestamp ? Number(d.l1BlockTimestamp) : 0;
                  return (
                    <div key={`dep-${i}`} className="hist-row">
                      <span className="num" style={{ textAlign: "right", color: "var(--green)" }}>
                        +{formatFees(d.amount, feeJuiceDecimals)}
                      </span>
                      <span className="hash">
                        {d.l1TransactionHash ? (
                          <TxEtherscanLink
                            txHash={d.l1TransactionHash}
                            content={truncateHashString(d.l1TransactionHash, 8, 6)}
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
                            showExternalLinkIcon={false}
                          />
                        ) : (
                          <span style={{ color: "var(--ink-3)" }}>—</span>
                        )}
                      </span>
                      <span className="age" style={{ textAlign: "right" }}>
                        {ts ? (
                          <span title={ageStr(ts)}>
                            {new Date(ts).toISOString().replace("T", " ").slice(0, 19)}
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
