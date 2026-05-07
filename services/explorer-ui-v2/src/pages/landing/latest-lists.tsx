import { type UiBlockTable, type UiTxEffectTable } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
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
        {txs.map((t) => {
          const ts = Number(t.timestamp);
          return (
            <Link
              key={t.txHash}
              className="row row-tx"
              to="/tx-effects/$hash"
              params={{ hash: t.txHash }}
            >
              <HashCell value={t.txHash} />
              <span className="num">#{fmtNum(Number(t.blockNumber))}</span>
              <span className="num">
                {formatFees(t.transactionFee, feeJuiceDecimals)}
                <TokenEtherscanLink
                  symbol={feeJuiceSymbol}
                  address={feeJuiceAddress}
                  className="u"
                />
              </span>
              <span className="age">{ageStr(ts)}</span>
            </Link>
          );
        })}
        {txs.length === 0 && (
          <div className="empty-state">waiting for transactions…</div>
        )}
      </div>
    </div>
  </div>
);
