import { type PublicCallRequest } from "@chicmoz-pkg/types";
import { type FC } from "react";
import { ContractInstanceLink, L2AddressLink } from "~/components/common";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ageStr, toIsoUtc } from "~/lib/utils";

const callTypeTone: Record<PublicCallRequest["callType"], string> = {
  non_revertible: "ok",
  revertible: "purple",
  teardown: "warn",
};

const callTypeTooltip: Record<PublicCallRequest["callType"], string> = {
  non_revertible:
    "Non-revertible — state changes persist even if later calls fail.",
  revertible:
    "Revertible — state changes roll back if a later call fails.",
  teardown:
    "Teardown — final cleanup phase after main execution, used for fee refunds.",
};

const CALL_TYPE_HEADER_TOOLTIP =
  "Execution model set at tx submission.\nNon-revertible: persists through failures.\nRevertible: rolls back on later failure.\nTeardown: cleanup & fee refunds.";

const STATIC_HEADER_TOOLTIP =
  "Whether this call modifies state.\nStatic calls are read-only and cannot write.";

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
            <Tooltip>
              <TooltipTrigger>
                <span className="header-tip-q" style={{ color: "var(--ink-3)", cursor: "help" }}>?</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64 whitespace-pre-line">
                <p>{CALL_TYPE_HEADER_TOOLTIP}</p>
              </TooltipContent>
            </Tooltip>
          </span>
        </div>
        <div className="right">
          <span className="header-tip">
            Static{" "}
            <Tooltip>
              <TooltipTrigger>
                <span className="header-tip-q" style={{ color: "var(--ink-3)", cursor: "help" }}>?</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64 whitespace-pre-line">
                <p>{STATIC_HEADER_TOOLTIP}</p>
              </TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger>
                <span
                  className={`tag-chip tag-chip-${callTypeTone[r.callType]}`}
                  style={{ cursor: "help" }}
                >
                  {r.callType.replace(/_/g, " ")}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                <p>{callTypeTooltip[r.callType]}</p>
              </TooltipContent>
            </Tooltip>
          </span>
          <span className="num">
            {r.isStaticCall ? (
              <Tooltip>
                <TooltipTrigger>
                  <span className="tag-chip tag-chip-purple" style={{ cursor: "help" }}>yes</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  <p>Read-only call — does not modify state</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <span className="mute" style={{ cursor: "help" }}>no</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  <p>This call may modify state</p>
                </TooltipContent>
              </Tooltip>
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
