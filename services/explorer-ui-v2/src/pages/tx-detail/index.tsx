import { Link, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import {
  DetailField,
  FeePaymentMethodBadge,
  CopyableAmount,
  L2AddressLink,
  StatusPill,
  TokenEtherscanLink,
} from "~/components/common";
import { L2ToL1MsgsTable } from "~/components/data/l2-to-l1-msgs-table";
import { PublicCallRequestsTable } from "~/components/data/public-call-requests-table";
import { ConsoleHead, Shell } from "~/components/layout";
import { HashList } from "./hash-list";
import { LogsPanel } from "./logs-panel";
import {
  useDroppedTxByHash,
  useGetTxEffectByHash,
  usePendingTxsByHash,
  usePublicCallRequestsByTxHash,
  useChainInfo,
} from "~/hooks/api";
import {
  ageStr,
  fmtNum,
  formatFees,
  getFeeJuiceSymbol,
  toIsoUtc,
  truncateHashString,
} from "~/lib/utils";

type Tab = "notes" | "nulls" | "public" | "l1" | "logs" | "calls";

export const TxDetailPage: FC = () => {
  const { hash = "" } = useParams({ strict: false });
  const [tab, setTab] = useState<Tab>("notes");

  const { data: pending } = usePendingTxsByHash(hash);
  const { data: effect } = useGetTxEffectByHash(hash, !!pending);
  const { data: dropped } = useDroppedTxByHash(hash);
  const { data: chainInfo } = useChainInfo();
  const { data: minedPublicCalls } = usePublicCallRequestsByTxHash(
    effect ? hash : "",
  );
  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;

  const mined = !!effect;
  const status = mined
    ? "mined"
    : dropped
      ? "dropped"
      : pending
        ? "pending"
        : "pending";

  const ts = effect?.timestamp
    ? effect.timestamp
    : pending?.birthTimestamp
      ? pending.birthTimestamp
      : dropped?.droppedAt
        ? dropped.droppedAt
        : undefined;

  const noteHashes = effect?.noteHashes ?? [];
  const nullifiers = effect?.nullifiers ?? [];
  const publicDataWrites = effect?.publicDataWrites ?? [];
  const l2ToL1Msgs = effect?.l2ToL1Msgs ?? [];
  const privateLogs = effect?.privateLogs ?? [];
  const publicLogs = effect?.publicLogs ?? [];
  const contractClassLogs = effect?.contractClassLogs ?? [];
  const logsCount =
    privateLogs.length + publicLogs.length + contractClassLogs.length;

  return (
    <Shell active="txs">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "tx-effects", to: "/tx-effects" },
          { label: truncateHashString(hash, 12, 10), active: true },
        ]}
        comment={`/api/l2/tx-effects/${truncateHashString(hash, 8, 6)}`}
      />

      <div className="detail-header">
        <div className="kicker">Tx effect · {ts ? ageStr(ts) : "—"}</div>
        <h1 className="hash-sized">{hash}</h1>
        <div className="meta-row">
          <StatusPill status={status} />
          {mined && effect?.blockHeight !== undefined && (
            <span className="meta-line">
              in{" "}
              <Link
                to="/blocks/$blockNumber"
                params={{ blockNumber: String(effect.blockHeight) }}
              >
                #{fmtNum(Number(effect.blockHeight))}
              </Link>
            </span>
          )}
          {dropped && (
            <span className="meta-line" style={{ color: "var(--red)" }}>
              dropped at {toIsoUtc(dropped.droppedAt)}
            </span>
          )}
        </div>
      </div>

      {mined && effect && (
        <>
          <div className="stats-strip">
            <div className="sc">
              <div className="lbl">Fee paid</div>
              <div className="val">
                <CopyableAmount
                  displayAmount={formatFees(
                    effect.transactionFee,
                    feeJuiceDecimals,
                    5,
                  )}
                  rawAmount={effect.transactionFee}
                />
                <TokenEtherscanLink
                  symbol={feeJuiceSymbol}
                  address={feeJuiceAddress}
                  className="u"
                />
              </div>
            </div>
            <div className="sc">
              <div className="lbl">Block</div>
              <div className="val">
                <Link
                  to="/blocks/$blockNumber"
                  params={{ blockNumber: String(effect.blockHeight) }}
                >
                  #{fmtNum(Number(effect.blockHeight))}
                </Link>
              </div>
            </div>
            <div className="sc">
              <div className="lbl">Note hashes</div>
              <div className="val">{noteHashes.length}</div>
            </div>
            <div className="sc">
              <div className="lbl">Nullifiers</div>
              <div className="val">{nullifiers.length}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>
                Transaction<span className="tag">mined transaction</span>
              </h3>
            </div>
            <div className="kv-grid">
              <DetailField label="Tx hash" width="extra-wide">
                {effect.txHash}
              </DetailField>
              <DetailField label="Status" width="extra-wide">
                <span style={{ color: "var(--green)" }}>mined</span>
              </DetailField>
              <DetailField label="Block" width="extra-wide">
                <Link
                  to="/blocks/$blockNumber"
                  params={{ blockNumber: String(effect.blockHeight) }}
                >
                  #{fmtNum(Number(effect.blockHeight))}
                </Link>
              </DetailField>
              <DetailField label="Block hash" width="extra-wide">
                {effect.blockHash}
              </DetailField>
              <DetailField label="Timestamp" width="extra-wide">
                {toIsoUtc(ts)}{" "}
                <span className="mute">· {ts ? ageStr(ts) : "—"}</span>
              </DetailField>
              <DetailField label="Transaction fee" width="extra-wide">
                <CopyableAmount
                  displayAmount={formatFees(
                    effect.transactionFee,
                    feeJuiceDecimals,
                    5,
                  )}
                  rawAmount={effect.transactionFee}
                />{" "}
                <TokenEtherscanLink
                  symbol={feeJuiceSymbol}
                  address={feeJuiceAddress}
                />
              </DetailField>
              {effect.feePayer && (
                <DetailField label="Fee payer" width="extra-wide">
                  <L2AddressLink address={effect.feePayer} truncate={false} />
                </DetailField>
              )}
              {effect.initiator && (
                <DetailField label="Initiator" width="extra-wide">
                  <L2AddressLink address={effect.initiator} truncate={false} />
                </DetailField>
              )}
              {effect.feePaymentMethod && (
                <DetailField label="Fee payment method" width="extra-wide">
                  <FeePaymentMethodBadge method={effect.feePaymentMethod} />
                </DetailField>
              )}
              <DetailField label="Revert code" width="extra-wide">
                <span
                  style={{
                    color: effect.revertCode.code
                      ? "var(--red)"
                      : "var(--green)",
                  }}
                >
                  {effect.revertCode.code} ·{" "}
                  {effect.revertCode.code ? "reverted" : "ok"}
                </span>
              </DetailField>
            </div>
          </div>

          <div className="panel">
            <div className="tabs">
              <button
                className={tab === "notes" ? "on" : ""}
                onClick={() => setTab("notes")}
              >
                Note hashes<span className="c">{noteHashes.length}</span>
              </button>
              <button
                className={tab === "nulls" ? "on" : ""}
                onClick={() => setTab("nulls")}
              >
                Nullifiers<span className="c">{nullifiers.length}</span>
              </button>
              <button
                className={tab === "public" ? "on" : ""}
                onClick={() => setTab("public")}
              >
                Public writes
                <span className="c">{publicDataWrites.length}</span>
              </button>
              <button
                className={tab === "l1" ? "on" : ""}
                onClick={() => setTab("l1")}
              >
                L2 → L1 msgs<span className="c">{l2ToL1Msgs.length}</span>
              </button>
              <button
                className={tab === "logs" ? "on" : ""}
                onClick={() => setTab("logs")}
              >
                Logs<span className="c">{logsCount}</span>
              </button>
              <button
                className={tab === "calls" ? "on" : ""}
                onClick={() => setTab("calls")}
              >
                Public calls
                <span className="c">{minedPublicCalls?.length ?? 0}</span>
              </button>
            </div>
            {tab === "notes" && (
              <HashList items={noteHashes} emptyMessage="no note hashes" />
            )}
            {tab === "nulls" && (
              <HashList items={nullifiers} emptyMessage="no nullifiers" />
            )}
            {tab === "public" && (
              <div>
                {publicDataWrites.map((w, i) => (
                  <div key={i} className="list-row">
                    <span className="idx">{i}</span>
                    <span className="v">
                      <span style={{ color: "var(--ink-3)" }}>slot </span>
                      {w.leafSlot}
                      <br />
                      <span style={{ color: "var(--ink-3)" }}>val </span>
                      {w.value}
                    </span>
                  </div>
                ))}
                {publicDataWrites.length === 0 && (
                  <div className="empty-state">no public data writes</div>
                )}
              </div>
            )}
            {tab === "l1" && (
              <HashList items={l2ToL1Msgs} emptyMessage="no L2 → L1 messages" />
            )}
            {tab === "logs" && (
              <LogsPanel
                privateLogs={privateLogs}
                publicLogs={publicLogs}
                contractClassLogs={contractClassLogs}
              />
            )}
            {tab === "calls" && (
              <PublicCallRequestsTable data={minedPublicCalls} />
            )}
          </div>
        </>
      )}

      {!mined && pending && (
        <>
          <div className="panel">
            <div className="panel-head">
              <h3>
                Pending
                <span className="tag">
                  /api/l2/txs/{truncateHashString(hash, 6, 4)}
                </span>
              </h3>
            </div>
            <div className="kv-grid">
              <DetailField label="Tx hash" width="extra-wide">
                {pending.txHash}
              </DetailField>
              <DetailField label="Fee payer" width="extra-wide">
                <L2AddressLink address={pending.feePayer} truncate={false} />
              </DetailField>
              {pending.initiator && (
                <DetailField label="Initiator" width="extra-wide">
                  <L2AddressLink address={pending.initiator} truncate={false} />
                </DetailField>
              )}
              {pending.feePaymentMethod && (
                <DetailField label="Fee payment method" width="extra-wide">
                  <FeePaymentMethodBadge method={pending.feePaymentMethod} />
                </DetailField>
              )}
              <DetailField label="Seen at" width="extra-wide">
                {toIsoUtc(pending.birthTimestamp)}{" "}
                <span className="mute">· {ageStr(pending.birthTimestamp)}</span>
              </DetailField>
            </div>
          </div>

          {pending.publicCallRequests &&
            pending.publicCallRequests.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <h3>
                    Public call requests
                    <span className="c">
                      {pending.publicCallRequests.length}
                    </span>
                  </h3>
                </div>
                <PublicCallRequestsTable data={pending.publicCallRequests} />
              </div>
            )}

          {pending.l2ToL1Msgs && pending.l2ToL1Msgs.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <h3>
                  L2 → L1 messages
                  <span className="c">{pending.l2ToL1Msgs.length}</span>
                </h3>
              </div>
              <L2ToL1MsgsTable data={pending.l2ToL1Msgs} omitTxHash />
            </div>
          )}
        </>
      )}

      {!mined && !pending && dropped && (
        <div className="panel">
          <div className="panel-head">
            <h3>
              Dropped
              <span className="tag">
                /api/l2/dropped-txs/{truncateHashString(hash, 6, 4)}
              </span>
            </h3>
          </div>
          <div className="kv-grid">
            <DetailField label="Tx hash" width="extra-wide">
              {dropped.txHash}
            </DetailField>
            <DetailField label="Seen as pending at" width="extra-wide">
              {toIsoUtc(dropped.createdAsPendingAt)}
            </DetailField>
            <DetailField label="Dropped at" width="extra-wide">
              {toIsoUtc(dropped.droppedAt)}
            </DetailField>
            {dropped.dropReason && (
              <DetailField label="Reason" width="extra-wide">
                {dropped.dropReason}
              </DetailField>
            )}
          </div>
        </div>
      )}

      {!mined && !pending && !dropped && (
        <div className="panel">
          <div className="empty-state">tx not found</div>
        </div>
      )}
    </Shell>
  );
};
