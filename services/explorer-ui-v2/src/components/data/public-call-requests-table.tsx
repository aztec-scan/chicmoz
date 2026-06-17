import { type PublicCallRequest } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { ContractInstanceLink, L2AddressLink } from "~/components/common";
import { ageStr, toIsoUtc } from "~/lib/utils";

const callTypeTone: Record<PublicCallRequest["callType"], string> = {
  non_revertible: "ok",
  revertible: "purple",
  teardown: "warn",
};

const callTypeTooltip: Record<PublicCallRequest["callType"], string> = {
  non_revertible:
    "During execution this call was non-revertible — its state changes persist regardless of later call outcomes",
  revertible:
    "During execution this call was revertible — its state changes could have been rolled back if a later call failed",
  teardown:
    "Final cleanup phase — runs after main execution, used for fee refunds and teardown",
};

const CALL_TYPE_HEADER_TOOLTIP =
  "Execution model of this public call, set at tx submission. Non-revertible calls persist even if later phases fail; revertible calls can be rolled back; teardown is final cleanup.";

const STATIC_HEADER_TOOLTIP =
  "Whether this call is read-only. Static calls cannot modify state.";

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
        <div>
          <span className="header-tip">
            Call type{" "}
            <span
              className="header-tip-q"
              style={{ color: "var(--ink-3)", cursor: "help" }}
              title={CALL_TYPE_HEADER_TOOLTIP}
            >
              ?
            </span>
          </span>
        </div>
        <div className="right">
          <span className="header-tip">
            Static{" "}
            <span
              className="header-tip-q"
              style={{ color: "var(--ink-3)", cursor: "help" }}
              title={STATIC_HEADER_TOOLTIP}
            >
              ?
            </span>
          </span>
        </div>
        <div className="right">Timestamp</div>
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
            <span
              className={`tag-chip tag-chip-${callTypeTone[r.callType]}`}
              title={callTypeTooltip[r.callType]}
              style={{ cursor: "help" }}
            >
              {r.callType.replace(/_/g, " ")}
            </span>
          </span>
          <span className="num">
            {r.isStaticCall ? (
              <span
                className="tag-chip tag-chip-purple"
                title="Read-only call — does not modify state"
                style={{ cursor: "help" }}
              >
                yes
              </span>
            ) : (
              <span
                className="mute"
                title="This call may modify state"
                style={{ cursor: "help" }}
              >
                no
              </span>
            )}
          </span>
          <span className="age" style={{ textAlign: "right" }}>
            {r.timestamp ? (
              <span title={toIsoUtc(r.timestamp)} style={{ cursor: "help" }}>
                {ageStr(r.timestamp)}
              </span>
            ) : (
              <span className="mute" title="Transaction not yet confirmed" style={{ cursor: "help" }}>
                pending
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};
