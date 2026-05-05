import { Link, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { DetailField, StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { HashList } from "./hash-list";
import {
  useDroppedTxByHash,
  useGetTxEffectByHash,
  usePendingTxsByHash,
} from "~/hooks/api";
import { ageStr, fmtNum, formatFees, toIsoUtc, truncateHashString } from "~/lib/utils";

type Tab = "notes" | "nulls" | "public" | "l1" | "logs";

export const TxDetailPage: FC = () => {
  const { hash = "" } = useParams({ strict: false });
  const [tab, setTab] = useState<Tab>("notes");

  const { data: effect } = useGetTxEffectByHash(hash);
  const { data: pending } = usePendingTxsByHash(hash);
  const { data: dropped } = useDroppedTxByHash(hash);

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
        <div className="kicker">
          Tx effect · {ts ? ageStr(ts) : "—"}
        </div>
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
            <span
              className="meta-line"
              style={{ color: "var(--red)" }}
            >
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
                {formatFees(effect.transactionFee, 18, 5)}
                <span className="u">FJ</span>
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
                Transaction<span className="tag">ChicmozL2TxEffectDeluxe</span>
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
                {toIsoUtc(ts)} <span className="mute">· {ts ? ageStr(ts) : "—"}</span>
              </DetailField>
              <DetailField label="Transaction fee" width="extra-wide">
                {formatFees(effect.transactionFee, 18, 5)} FJ
              </DetailField>
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
                Public writes<span className="c">{publicDataWrites.length}</span>
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
              <div className="kv-grid">
                <DetailField label="Private logs">{privateLogs.length}</DetailField>
                <DetailField label="Public logs">{publicLogs.length}</DetailField>
                <DetailField label="Contract class logs">
                  {contractClassLogs.length}
                </DetailField>
              </div>
            )}
          </div>
        </>
      )}

      {!mined && pending && (
        <div className="panel">
          <div className="panel-head">
            <h3>
              Pending<span className="tag">/api/l2/txs/{truncateHashString(hash, 6, 4)}</span>
            </h3>
          </div>
          <div className="kv-grid">
            <DetailField label="Tx hash" width="extra-wide">
              {pending.txHash}
            </DetailField>
            <DetailField label="Fee payer" width="extra-wide">
              {pending.feePayer}
            </DetailField>
            <DetailField label="Seen at" width="extra-wide">
              {toIsoUtc(pending.birthTimestamp)}{" "}
              <span className="mute">· {ageStr(pending.birthTimestamp)}</span>
            </DetailField>
          </div>
        </div>
      )}

      {!mined && !pending && dropped && (
        <div className="panel">
          <div className="panel-head">
            <h3>
              Dropped<span className="tag">/api/l2/dropped-txs/{truncateHashString(hash, 6, 4)}</span>
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
