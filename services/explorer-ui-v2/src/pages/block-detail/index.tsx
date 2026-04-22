import { Link, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useGetBlockByIdentifier,
  useGetTableTxEffectsByBlockHeight,
} from "~/hooks/api";
import { blockStatusToDisplay } from "~/lib/block-status";
import { ageStr, fmtNum, formatFees, toIsoUtc, truncateHashString } from "~/lib/utils";

type Tab = "txs" | "roots" | "contracts";

export const BlockDetailPage: FC = () => {
  const { blockNumber = "" } = useParams({ strict: false });
  const [tab, setTab] = useState<Tab>("txs");

  const { data: block, isLoading, isError } = useGetBlockByIdentifier(blockNumber);
  const height = block?.height ? Number(block.height) : undefined;
  const { data: txs } = useGetTableTxEffectsByBlockHeight(
    block?.height !== undefined ? block.height : undefined,
  );

  if (isLoading) {
    return (
      <Shell active="blocks">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "blocks", to: "/blocks" },
            { label: `#${blockNumber}`, active: true },
          ]}
          comment={`/api/l2/blocks/${blockNumber}`}
        />
        <div className="panel">
          <div className="empty-state">loading block…</div>
        </div>
      </Shell>
    );
  }

  if (isError || !block) {
    return (
      <Shell active="blocks">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "blocks", to: "/blocks" },
            { label: `#${blockNumber}`, active: true },
          ]}
        />
        <div className="panel">
          <div className="empty-state">block not found</div>
        </div>
      </Shell>
    );
  }

  const status = blockStatusToDisplay(block.finalizationStatus, !!block.orphan);
  const ts = Number(block.header.globalVariables.timestamp);
  const totalFees = formatFees(block.header.totalFees);
  const totalManaUsed = block.header.totalManaUsed?.toString?.() ?? "0";
  const txCount = block.body.txEffects.length;

  return (
    <Shell active="blocks">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "blocks", to: "/blocks" },
          { label: `#${fmtNum(height)}`, active: true },
        ]}
        comment={`/api/l2/blocks/${height}`}
      />

      <div className="detail-header with-nav">
        <div>
          <div className="kicker">Block · {ageStr(ts)}</div>
          <h1>
            <span className="pfx">#</span>
            {fmtNum(height)}
          </h1>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <StatusPill status={status} />
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--ink-3)",
              }}
            >
              {txCount} txs · {totalFees} FJ
            </span>
          </div>
          <div className="hash">{block.hash}</div>
        </div>
        <div className="nav-pair">
          {height !== undefined && height > 0 && (
            <Link
              to="/blocks/$blockNumber"
              params={{ blockNumber: String(height - 1) }}
            >
              ‹ #{fmtNum(height - 1)}
            </Link>
          )}
          {height !== undefined && (
            <Link
              to="/blocks/$blockNumber"
              params={{ blockNumber: String(height + 1) }}
            >
              #{fmtNum(height + 1)} ›
            </Link>
          )}
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Tx count</div>
          <div className="val">{txCount}</div>
        </div>
        <div className="sc">
          <div className="lbl">Total fees</div>
          <div className="val">
            {totalFees}
            <span className="u">FJ</span>
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Mana used</div>
          <div className="val">{fmtNum(totalManaUsed)}</div>
        </div>
        <div className="sc">
          <div className="lbl">L1 block</div>
          <div className="val">
            {block.proposedOnL1?.l1BlockNumber !== undefined
              ? `#${fmtNum(Number(block.proposedOnL1.l1BlockNumber))}`
              : "—"}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Age</div>
          <div className="val">{ageStr(ts).replace(" ago", "")}</div>
        </div>
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-head">
            <h3>
              Header<span className="tag">chicmozL2BlockLight</span>
            </h3>
          </div>
          <div className="kv-grid">
            <div className="kv wide">
              <span className="k">Height</span>
              <span className="v">#{fmtNum(height)}</span>
            </div>
            <div className="kv wide">
              <span className="k">Hash</span>
              <span className="v">{block.hash}</span>
            </div>
            <div className="kv wide">
              <span className="k">Parent archive</span>
              <span className="v">
                {height && height > 0 ? (
                  <Link
                    to="/blocks/$blockNumber"
                    params={{ blockNumber: String(height - 1) }}
                  >
                    {block.header.lastArchive.root}
                  </Link>
                ) : (
                  block.header.lastArchive.root
                )}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Archive root</span>
              <span className="v">{block.archive.root}</span>
            </div>
            <div className="kv wide">
              <span className="k">Timestamp</span>
              <span className="v">
                {toIsoUtc(ts)} <span className="mute">· {ageStr(ts)}</span>
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Status</span>
              <span className="v" style={{ color: "var(--green)" }}>
                {status}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Slot</span>
              <span className="v">
                {fmtNum(block.header.globalVariables.slotNumber)}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Rollup version</span>
              <span className="v">
                {block.header.globalVariables.version}
              </span>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>
              Settlement<span className="tag">L1 anchor</span>
            </h3>
          </div>
          <div className="kv-grid">
            <div className="kv wide">
              <span className="k">Coinbase</span>
              <span className="v">{block.header.globalVariables.coinbase}</span>
            </div>
            <div className="kv wide">
              <span className="k">Fee recipient</span>
              <span className="v">
                {block.header.globalVariables.feeRecipient}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">L1 block</span>
              <span className="v">
                {block.proposedOnL1?.l1BlockNumber !== undefined
                  ? `#${fmtNum(Number(block.proposedOnL1.l1BlockNumber))} · ethereum`
                  : "—"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">L1 block hash</span>
              <span className="v">
                {block.proposedOnL1?.l1BlockHash ?? "—"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Rollup contract</span>
              <span className="v">
                {block.proposedOnL1?.l1ContractAddress ?? "—"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Prover</span>
              <span className="v">
                {block.proofVerifiedOnL1?.proverId
                  ? truncateHashString(block.proofVerifiedOnL1.proverId, 14, 12)
                  : "—"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Fee per L2 gas</span>
              <span className="v">
                {fmtNum(block.header.globalVariables.gasFees.feePerL2Gas)}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Fee per DA gas</span>
              <span className="v">
                {fmtNum(block.header.globalVariables.gasFees.feePerDaGas)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="tabs">
          <button
            className={tab === "txs" ? "on" : ""}
            onClick={() => setTab("txs")}
          >
            Tx effects<span className="c">{txCount}</span>
          </button>
          <button
            className={tab === "roots" ? "on" : ""}
            onClick={() => setTab("roots")}
          >
            Roots<span className="c">3</span>
          </button>
          <button
            className={tab === "contracts" ? "on" : ""}
            onClick={() => setTab("contracts")}
          >
            Contracts<span className="c">0</span>
          </button>
        </div>
        {tab === "txs" && (
          <div>
            <div className="block-tx-head">
              <div>Tx hash</div>
              <div style={{ textAlign: "right" }}>Idx</div>
              <div style={{ textAlign: "right" }}>Fee (FJ)</div>
            </div>
            {(txs ?? []).map((t, i) => (
              <Link
                key={t.txHash}
                className="block-tx-row"
                to="/tx-effects/$hash"
                params={{ hash: t.txHash }}
              >
                <span className="hash">{t.txHash}</span>
                <span className="idx">{i}</span>
                <span className="num">{formatFees(t.transactionFee)}</span>
              </Link>
            ))}
            {(!txs || txs.length === 0) && (
              <div className="empty-state">
                {txs ? "no tx-effects in this block" : "loading tx-effects…"}
              </div>
            )}
          </div>
        )}
        {tab === "roots" && (
          <div className="kv-grid">
            <div className="kv wide">
              <span className="k">Note hash tree</span>
              <span className="v">
                {block.header.state.partial.noteHashTree.root}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Nullifier tree</span>
              <span className="v">
                {block.header.state.partial.nullifierTree.root}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Public data tree</span>
              <span className="v">
                {block.header.state.partial.publicDataTree.root}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">L1→L2 message tree</span>
              <span className="v">
                {block.header.state.l1ToL2MessageTree.root}
              </span>
            </div>
          </div>
        )}
        {tab === "contracts" && (
          <div className="empty-state">
            contract deployments per block not surfaced by the API
          </div>
        )}
      </div>
    </Shell>
  );
};
