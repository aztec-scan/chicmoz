import { type ChicmozL1FeeJuicePortalDeposit } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { StatusPill, TxEtherscanLink } from "~/components/common";
import { ageStr, formatFees, truncateHashString } from "~/lib/utils";

interface Props {
  data: ChicmozL1FeeJuicePortalDeposit[] | undefined;
  /** Formatted symbol for the fee juice token (e.g. "AZTEC"). */
  feeJuiceSymbol?: string;
  /** Decimal precision for amount formatting (default: 18). */
  feeJuiceDecimals?: number;
  /** Hide the `to` column when the recipient is already implicit (address/contract page). */
  omitRecipient?: boolean;
  emptyMessage?: string;
}

export const FeeJuiceDepositsTable: FC<Props> = ({
  data,
  feeJuiceSymbol = "AZTEC",
  feeJuiceDecimals = 18,
  omitRecipient = false,
  emptyMessage = "no L1 → L2 fee juice deposits",
}) => {
  if (!data || data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const colsClass = omitRecipient ? "fjd-cols-narrow" : "fjd-cols";

  return (
    <div>
      <div className={`table-head ${colsClass}`}>
        <div>L1 tx</div>
        <div className="right">Age</div>
        {!omitRecipient && <div>L2 recipient</div>}
        <div className="right">Amount</div>
        <div>Status</div>
      </div>
      {data.map((d, i) => {
        const ts = d.l1BlockTimestamp
          ? new Date(d.l1BlockTimestamp).getTime()
          : null;

        return (
          <div
            key={`${d.l1TransactionHash ?? ""}-${d.l1LogIndex ?? i}`}
            className={`trow ${colsClass}`}
          >
            <span className="hash">
              {d.l1TransactionHash ? (
                <TxEtherscanLink
                  txHash={d.l1TransactionHash}
                  content={truncateHashString(d.l1TransactionHash)}
                  title={`secret hash: ${d.secretHash}`}
                />
              ) : (
                <span style={{ color: "var(--ink-3)" }}>—</span>
              )}
            </span>

            <span className="age" style={{ textAlign: "right" }}>
              {ts ? (
                <span title={new Date(ts).toISOString().replace("T", " ").slice(0, 19) + " UTC"}>
                  {ageStr(ts)}
                </span>
              ) : (
                <span style={{ color: "var(--ink-3)" }}>
                  {d.l1BlockNumber != null ? `block ${d.l1BlockNumber}` : "—"}
                </span>
              )}
            </span>

            {!omitRecipient && (
              <span className="hash" title={d.to}>
                {truncateHashString(d.to)}
              </span>
            )}

            <span className="num" title={`${d.amount?.toString() ?? "?"} wei`}>
              {d.amount != null
                ? `${formatFees(d.amount, feeJuiceDecimals)} ${feeJuiceSymbol}`
                : "—"}
            </span>

            <span>
              <StatusPill
                status={d.isFinalized ? "finalized" : "pending"}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
};
