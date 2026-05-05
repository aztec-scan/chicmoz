import { type ChicmozL2PendingL2ToL1Msg } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { ContractInstanceLink, L1AddressLink } from "~/components/common";
import { truncateHashString } from "~/lib/utils";

interface Props {
  data: ChicmozL2PendingL2ToL1Msg[] | undefined;
  /** Hide the txHash column (used on a tx detail page where the tx is implicit). */
  omitTxHash?: boolean;
  /** Hide the recipient column (used on the L1 address page where it's implicit). */
  omitRecipient?: boolean;
  emptyMessage?: string;
}

export const L2ToL1MsgsTable: FC<Props> = ({
  data,
  omitTxHash = false,
  omitRecipient = false,
  emptyMessage = "no L2 → L1 messages",
}) => {
  if (!data || data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const colsClass =
    omitTxHash && omitRecipient
      ? "l2l1-cols-narrowest"
      : omitTxHash || omitRecipient
        ? "l2l1-cols-narrow"
        : "l2l1-cols";

  return (
    <div>
      <div className={`table-head ${colsClass}`}>
        <div className="right">#</div>
        {!omitTxHash && <div>Tx hash</div>}
        <div>Contract (L2)</div>
        {!omitRecipient && <div>Recipient (L1)</div>}
        <div>Content</div>
      </div>
      {data.map((m, i) => (
        <div key={`${m.txHash}-${m.index}-${i}`} className={`trow ${colsClass}`}>
          <span className="rank">{m.index}</span>
          {!omitTxHash && (
            <span className="hash">
              <Link to="/tx-effects/$hash" params={{ hash: m.txHash }}>
                {truncateHashString(m.txHash)}
              </Link>
            </span>
          )}
          <span className="addr">
            <ContractInstanceLink address={m.contractAddress} />
          </span>
          {!omitRecipient && (
            <span className="addr">
              <L1AddressLink address={m.recipient} />
            </span>
          )}
          <span className="hash" title={m.content}>
            {truncateHashString(m.content)}
          </span>
        </div>
      ))}
    </div>
  );
};
