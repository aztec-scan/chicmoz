import { type UiBlockTable, type UiTxEffectTable } from "@chicmoz-pkg/types";
import { Link, useNavigate } from "@tanstack/react-router";
import { type FC, type KeyboardEvent, type MouseEvent } from "react";
import { HashCell, StatusPill, TokenEtherscanLink } from "~/components/common";
import { blockStatusToDisplay } from "~/lib/block-status";
import { ageStr, fmtNum, formatFees } from "~/lib/utils";

interface Props {
  blocks: UiBlockTable[];
  txs: UiTxEffectTable[];
  feeJuiceDecimals: number;
  feeJuiceSymbol: string;
  feeJuiceAddress?: string;
}

interface LatestTxRowProps {
  tx: UiTxEffectTable;
  feeJuiceDecimals: number;
  feeJuiceSymbol: string;
  feeJuiceAddress?: string;
}

const isFromInteractiveElement = (target: EventTarget): boolean =>
  target instanceof Element && Boolean(target.closest("a, button"));

const LatestTxRow: FC<LatestTxRowProps> = ({
  tx,
  feeJuiceDecimals,
  feeJuiceSymbol,
  feeJuiceAddress,
}) => {
  const navigate = useNavigate();
  const ts = Number(tx.timestamp);

  const navigateToTx = (): void => {
    void navigate({
      to: "/tx-effects/$hash",
      params: { hash: tx.txHash },
    });
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (isFromInteractiveElement(event.target)) {
      return;
    }
    navigateToTx();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (isFromInteractiveElement(event.target)) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToTx();
    }
  };

  return (
    <div
      className="row row-tx"
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <HashCell value={tx.txHash} />
      <span className="num">#{fmtNum(Number(tx.blockNumber))}</span>
      <span className="num">
        {formatFees(tx.transactionFee, feeJuiceDecimals)}
        <TokenEtherscanLink
          symbol={feeJuiceSymbol}
          address={feeJuiceAddress}
          className="u"
        />
      </span>
      <span className="age">{ageStr(ts)}</span>
    </div>
  );
};

export const LatestLists: FC<Props> = ({
  blocks,
  txs,
  feeJuiceDecimals,
  feeJuiceSymbol,
  feeJuiceAddress,
}) => (
  <div className="split">
    <div className="panel">
      <div className="panel-head">
        <h3>
          Latest blocks<span className="count">· last {blocks.length}</span>
        </h3>
        <Link to="/blocks" className="view-all">
          all blocks ↗
        </Link>
      </div>
      <div className="row-head block-cols">
        <div>Height</div>
        <div>Hash</div>
        <div style={{ textAlign: "right" }}>Txs</div>
        <div style={{ textAlign: "right" }}>Status</div>
        <div style={{ textAlign: "right" }}>Age</div>
      </div>
      <div className="rows">
        {blocks.map((b) => {
          const status = blockStatusToDisplay(b.blockStatus, b.orphan);
          const ts = Number(b.timestamp);
          return (
            <Link
              key={b.blockHash}
              className="row row-block"
              to="/blocks/$blockNumber"
              params={{ blockNumber: String(b.height) }}
            >
              <span className="h">
                <span className="pfx">#</span>
                {fmtNum(Number(b.height))}
              </span>
              <HashCell value={b.blockHash} />
              <span className="num">{b.txEffectsLength}</span>
              <span className="status-cell">
                <StatusPill status={status} />
              </span>
              <span className="age">{ageStr(ts)}</span>
            </Link>
          );
        })}
        {blocks.length === 0 && (
          <div className="empty-state">waiting for blocks…</div>
        )}
      </div>
    </div>

    <div className="panel">
      <div className="panel-head">
        <h3>
          Latest tx-effects<span className="count">· last {txs.length}</span>
        </h3>
        <Link to="/tx-effects" className="view-all">
          all txs ↗
        </Link>
      </div>
      <div className="row-head tx-cols">
        <div>Tx hash</div>
        <div style={{ textAlign: "right" }}>Block</div>
        <div style={{ textAlign: "right" }}>Fee ({feeJuiceSymbol})</div>
        <div style={{ textAlign: "right" }}>Age</div>
      </div>
      <div className="rows">
        {txs.map((t) => (
          <LatestTxRow
            key={t.txHash}
            tx={t}
            feeJuiceDecimals={feeJuiceDecimals}
            feeJuiceSymbol={feeJuiceSymbol}
            feeJuiceAddress={feeJuiceAddress}
          />
        ))}
        {txs.length === 0 && (
          <div className="empty-state">waiting for transactions…</div>
        )}
      </div>
    </div>
  </div>
);
