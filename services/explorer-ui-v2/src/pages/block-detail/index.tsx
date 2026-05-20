import { Link, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import {
  AddressEtherscanLink,
  DetailEmptyState,
  DetailField,
  EtherscanResourceLink,
  HashCell,
  StatusPill,
  TokenEtherscanLink,
  TxEtherscanLink,
} from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useChainInfo,
  useGetBlockByIdentifier,
  useGetTableTxEffectsByBlockHeight,
} from "~/hooks/api";
import { blockStatusToDisplay } from "~/lib/block-status";
import {
  ageStr,
  fmtNum,
  formatFees,
  getFeeJuiceSymbol,
  toIsoUtc,
  truncateHashString,
} from "~/lib/utils";

type Tab = "txs" | "roots" | "contracts";

export const BlockDetailPage: FC = () => {
  const { blockNumber = "" } = useParams({ strict: false });
  const [tab, setTab] = useState<Tab>("txs");

  const {
    data: block,
    isLoading,
    isError,
  } = useGetBlockByIdentifier(blockNumber);
  const { data: chainInfo } = useChainInfo();
  const height = block?.height ? Number(block.height) : undefined;
  const { data: txs } = useGetTableTxEffectsByBlockHeight(
    block?.height !== undefined ? block.height : undefined,
  );

  const stubCrumbs = [
    { label: "aztec-scan", to: "/" },
    { label: "blocks", to: "/blocks" },
    { label: `#${blockNumber}`, active: true },
  ];
  if (isLoading) {
    return (
      <DetailEmptyState
        active="blocks"
        crumbs={stubCrumbs}
        comment={`/api/l2/blocks/${blockNumber}`}
        message="loading block…"
      />
    );
  }
  if (isError || !block) {
    return (
      <DetailEmptyState
        active="blocks"
        crumbs={stubCrumbs}
        message="block not found"
      />
    );
  }

  const status = blockStatusToDisplay(block.finalizationStatus, !!block.orphan);
  const ts = Number(block.header.globalVariables.timestamp);
  const feeJuiceDecimals = chainInfo?.feeJuiceDecimals ?? 18;
  const feeJuiceSymbol = getFeeJuiceSymbol(chainInfo?.feeJuiceSymbol);
  const feeJuiceAddress = chainInfo?.l1ContractAddresses?.feeJuiceAddress;
  const totalFees = formatFees(block.header.totalFees, feeJuiceDecimals);
  const totalManaUsed = block.header.totalManaUsed?.toString?.() ?? "0";
  const txCount = block.body.txEffects.length;
  const blockRollupVersion = BigInt(block.header.globalVariables.version);
  const isOldRollup =
    chainInfo?.rollupVersion !== undefined &&
    blockRollupVersion !== chainInfo.rollupVersion;

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
            {isOldRollup && (
              <span
                style={{
                  border: "1px solid rgba(255, 176, 0, 0.55)",
                  color: "var(--yellow)",
                  borderRadius: 999,
                  padding: "3px 8px",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  textTransform: "uppercase",
                }}
                title={`Current rollup version is ${chainInfo.rollupVersion.toString()}`}
              >
                old rollup
              </span>
            )}
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--ink-3)",
              }}
            >
              {txCount} txs · {totalFees} {feeJuiceSymbol}
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
            <TokenEtherscanLink
              symbol={feeJuiceSymbol}
              address={feeJuiceAddress}
              className="u"
            />
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
            <DetailField label="Height" width="wide">
              #{fmtNum(height)}
            </DetailField>
            <DetailField label="Hash" width="wide">
              {block.hash}
            </DetailField>
            <DetailField label="Parent archive" width="wide">
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
            </DetailField>
            <DetailField label="Archive root" width="wide">
              {block.archive.root}
            </DetailField>
            <DetailField label="Timestamp" width="wide">
              {toIsoUtc(ts)} <span className="mute">· {ageStr(ts)}</span>
            </DetailField>
            <DetailField label="Status" width="wide">
              <span style={{ color: "var(--green)" }}>{status}</span>
            </DetailField>
            <DetailField label="Slot" width="wide">
              {fmtNum(block.header.globalVariables.slotNumber)}
            </DetailField>
            <DetailField label="Rollup version" width="wide">
              {blockRollupVersion.toString()}
              {isOldRollup && chainInfo?.rollupVersion !== undefined ? (
                <span className="mute">
                  {" "}· current {chainInfo.rollupVersion.toString()}
                </span>
              ) : null}
            </DetailField>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>
              Settlement<span className="tag">L1 anchor</span>
            </h3>
          </div>
          <div className="kv-grid">
            <DetailField label="Coinbase" width="wide">
              <AddressEtherscanLink
                address={block.header.globalVariables.coinbase}
                title="View coinbase on Etherscan"
              />
            </DetailField>
            <DetailField label="Fee recipient" width="wide">
              {block.header.globalVariables.feeRecipient}
            </DetailField>
            <DetailField label="L1 block" width="wide">
              <EtherscanResourceLink
                content={
                  block.proposedOnL1?.l1BlockNumber !== undefined
                    ? `#${fmtNum(Number(block.proposedOnL1.l1BlockNumber))} · ethereum`
                    : "—"
                }
                address={
                  block.proposedOnL1?.l1BlockNumber !== undefined
                    ? String(block.proposedOnL1.l1BlockNumber)
                    : undefined
                }
                resource="block"
                title="View L1 block on Etherscan"
              />
            </DetailField>
            <DetailField label="L1 block hash" width="wide">
              <EtherscanResourceLink
                content={
                  block.proposedOnL1?.l1BlockHash
                    ? truncateHashString(block.proposedOnL1.l1BlockHash, 14, 12)
                    : "—"
                }
                address={block.proposedOnL1?.l1BlockHash ?? undefined}
                resource="block"
                title="View L1 block on Etherscan"
              />
            </DetailField>
            <DetailField label="Proposal tx" width="wide">
              <TxEtherscanLink
                txHash={block.proposedOnL1?.l1TransactionHash ?? undefined}
                content={
                  block.proposedOnL1?.l1TransactionHash
                    ? truncateHashString(
                        block.proposedOnL1.l1TransactionHash,
                        14,
                        12,
                      )
                    : "—"
                }
                eventLog
                title="View block proposal transaction on Etherscan"
              />
            </DetailField>
            <DetailField label="Rollup contract" width="wide">
              <AddressEtherscanLink
                address={block.proposedOnL1?.l1ContractAddress}
              />
            </DetailField>
            <DetailField label="Prover" width="wide">
              <AddressEtherscanLink
                address={block.proofVerifiedOnL1?.proverId ?? undefined}
                content={
                  block.proofVerifiedOnL1?.proverId
                    ? truncateHashString(block.proofVerifiedOnL1.proverId, 14, 12)
                    : "—"
                }
                title="View prover on Etherscan"
              />
            </DetailField>
            <DetailField label="Proof tx" width="wide">
              <TxEtherscanLink
                txHash={block.proofVerifiedOnL1?.l1TransactionHash ?? undefined}
                content={
                  block.proofVerifiedOnL1?.l1TransactionHash
                    ? truncateHashString(
                        block.proofVerifiedOnL1.l1TransactionHash,
                        14,
                        12,
                      )
                    : "—"
                }
                eventLog
                title="View proof verification transaction on Etherscan"
              />
            </DetailField>
            <DetailField label="Fee per L2 gas" width="wide">
              {fmtNum(block.header.globalVariables.gasFees.feePerL2Gas)}
            </DetailField>
            <DetailField label="Fee per DA gas" width="wide">
              {fmtNum(block.header.globalVariables.gasFees.feePerDaGas)}
            </DetailField>
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
              <div style={{ textAlign: "right" }}>Fee ({feeJuiceSymbol})</div>
            </div>
            {(txs ?? []).map((t, i) => (
              <Link
                key={t.txHash}
                className="block-tx-row"
                to="/tx-effects/$hash"
                params={{ hash: t.txHash }}
              >
                <HashCell value={t.txHash} />
                <span className="idx">{i}</span>
                <span className="num">
                  {formatFees(t.transactionFee, feeJuiceDecimals)}
                  <TokenEtherscanLink
                    symbol={feeJuiceSymbol}
                    address={feeJuiceAddress}
                    className="u"
                  />
                </span>
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
            <DetailField label="Note hash tree" width="wide">
              {block.header.state.partial.noteHashTree.root}
            </DetailField>
            <DetailField label="Nullifier tree" width="wide">
              {block.header.state.partial.nullifierTree.root}
            </DetailField>
            <DetailField label="Public data tree" width="wide">
              {block.header.state.partial.publicDataTree.root}
            </DetailField>
            <DetailField label="L1→L2 message tree" width="wide">
              {block.header.state.l1ToL2MessageTree.root}
            </DetailField>
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
