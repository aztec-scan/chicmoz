import { type PublicCallRequest } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { ContractInstanceLink, L2AddressLink } from "~/components/common";

const callTypeTone: Record<PublicCallRequest["callType"], string> = {
  non_revertible: "ok",
  revertible: "purple",
  teardown: "warn",
};

interface Props {
  data: PublicCallRequest[] | undefined;
  /** Hide the msg-sender column (used on pages already filtered by sender). */
  omitSender?: boolean;
  emptyMessage?: string;
}

const fnLabel = (r: PublicCallRequest): string => {
  if (r.functionName) {return r.functionName;}
  if (r.functionSelector) {return r.functionSelector;}
  return "—";
};

export const PublicCallRequestsTable: FC<Props> = ({
  data,
  omitSender = false,
  emptyMessage = "no public call requests",
}) => {
  if (!data || data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const colsClass = omitSender ? "pcr-cols-narrow" : "pcr-cols";

  return (
    <div>
      <div className={`table-head ${colsClass}`}>
        {!omitSender && <div>Sender</div>}
        <div>Contract</div>
        <div>Contract name</div>
        <div>Function</div>
        <div>Call type</div>
        <div className="right">Static</div>
      </div>
      {data.map((r, i) => (
        <div key={`${r.contractAddress}-${i}`} className={`trow ${colsClass}`}>
          {!omitSender && (
            <span className="addr">
              <L2AddressLink address={r.msgSender} />
            </span>
          )}
          <span className="addr">
            <ContractInstanceLink address={r.contractAddress} />
          </span>
          <span style={{ color: "var(--ink-2)" }}>
            {r.contractName ?? <span className="mute">unknown</span>}
          </span>
          <span style={{ color: "var(--ink-2)" }}>{fnLabel(r)}</span>
          <span>
            <span className={`tag-chip tag-chip-${callTypeTone[r.callType]}`}>
              {r.callType.replace(/_/g, " ")}
            </span>
          </span>
          <span className="num">
            {r.isStaticCall ? (
              <span className="tag-chip tag-chip-purple">yes</span>
            ) : (
              <span className="mute">no</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};
