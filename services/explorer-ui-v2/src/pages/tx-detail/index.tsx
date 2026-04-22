import { Link, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
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
              <div className="kv extra-wide">
                <span className="k">Tx hash</span>
                <span className="v">{effect.txHash}</span>
              </div>
              <div className="kv extra-wide">
                <span className="k">Status</span>
                <span
                  className="v"
                  style={{ color: "var(--green)" }}
                >
                  mined
                </span>
              </div>
              <div className="kv extra-wide">
                <span className="k">Block</span>
                <span className="v">
                  <Link
                    to="/blocks/$blockNumber"
                    params={{ blockNumber: String(effect.blockHeight) }}
                  >
                    #{fmtNum(Number(effect.blockHeight))}
                  </Link>
                </span>
              </div>
              <div className="kv extra-wide">
                <span className="k">Block hash</span>
                <span className="v">{effect.blockHash}</span>
              </div>
              <div className="kv extra-wide">
                <span className="k">Timestamp</span>
                <span className="v">
                  {toIsoUtc(ts)} <span className="mute">· {ts ? ageStr(ts) : "—"}</span>
                </span>
              </div>
              <div className="kv extra-wide">
                <span className="k">Transaction fee</span>
                <span className="v">{formatFees(effect.transactionFee, 18, 5)} FJ</span>
              </div>
              <div className="kv extra-wide">
                <span className="k">Revert code</span>
                <span
                  className="v"
                  style={{
                    color: effect.revertCode.code
                      ? "var(--red)"
                      : "var(--green)",
                  }}
                >
                  {effect.revertCode.code} ·{" "}
                  {effect.revertCode.code ? "reverted" : "ok"}
                </span>
              </div>
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
              <div>
                {noteHashes.map((h, i) => (
                  <div key={`${h}-${i}`} className="list-row">
                    <span className="idx">{i}</span>
                    <span className="v">{h}</span>
                  </div>
                ))}
                {noteHashes.length === 0 && (
                  <div className="empty-state">no note hashes</div>
                )}
              </div>
            )}
            {tab === "nulls" && (
              <div>
                {nullifiers.map((h, i) => (
                  <div key={`${h}-${i}`} className="list-row">
                    <span className="idx">{i}</span>
                    <span className="v">{h}</span>
                  </div>
                ))}
                {nullifiers.length === 0 && (
                  <div className="empty-state">no nullifiers</div>
                )}
              </div>
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
              <div>
                {l2ToL1Msgs.map((m, i) => (
                  <div key={`${m}-${i}`} className="list-row">
                    <span className="idx">{i}</span>
                    <span className="v">{m}</span>
                  </div>
                ))}
                {l2ToL1Msgs.length === 0 && (
                  <div className="empty-state">no L2 → L1 messages</div>
                )}
              </div>
            )}
            {tab === "logs" && (
              <div className="kv-grid">
                <div className="kv">
                  <span className="k">Private logs</span>
                  <span className="v">{privateLogs.length}</span>
                </div>
                <div className="kv">
                  <span className="k">Public logs</span>
                  <span className="v">{publicLogs.length}</span>
                </div>
                <div className="kv">
                  <span className="k">Contract class logs</span>
                  <span className="v">{contractClassLogs.length}</span>
                </div>
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
            <div className="kv extra-wide">
              <span className="k">Tx hash</span>
              <span className="v">{pending.txHash}</span>
            </div>
            <div className="kv extra-wide">
              <span className="k">Fee payer</span>
              <span className="v">{pending.feePayer}</span>
            </div>
            <div className="kv extra-wide">
              <span className="k">Seen at</span>
              <span className="v">
                {toIsoUtc(pending.birthTimestamp)}{" "}
                <span className="mute">· {ageStr(pending.birthTimestamp)}</span>
              </span>
            </div>
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
            <div className="kv extra-wide">
              <span className="k">Tx hash</span>
              <span className="v">{dropped.txHash}</span>
            </div>
            <div className="kv extra-wide">
              <span className="k">Seen as pending at</span>
              <span className="v">{toIsoUtc(dropped.createdAsPendingAt)}</span>
            </div>
            <div className="kv extra-wide">
              <span className="k">Dropped at</span>
              <span className="v">{toIsoUtc(dropped.droppedAt)}</span>
            </div>
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
