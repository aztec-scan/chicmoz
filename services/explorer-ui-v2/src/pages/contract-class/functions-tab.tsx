import { type FC } from "react";
import { fmtNum } from "~/lib/utils";

export interface FunctionEntry {
  selector: { value: number | string };
  bytecode?: { length: number } | unknown[] | null;
}

interface Props {
  kind: "priv" | "util";
  entries: FunctionEntry[] | undefined;
}

const EMPTY_MESSAGE: Record<Props["kind"], string> = {
  priv: "no private functions broadcast",
  util: "no utility functions broadcast",
};

const bytecodeLen = (bc: FunctionEntry["bytecode"]): number | null => {
  if (!bc) {return null;}
  if (Array.isArray(bc)) {return bc.length;}
  if (typeof (bc as { length?: number }).length === "number") {
    return (bc as { length: number }).length;
  }
  return null;
};

export const FunctionsTab: FC<Props> = ({ kind, entries }) => {
  const rows = entries ?? [];
  return (
    <>
      <div className="fn-head">
        <div>Kind</div>
        <div>Signature</div>
        <div className="right">Selector</div>
        <div className="right">Bytecode</div>
      </div>
      {rows.map((f) => {
        const len = bytecodeLen(f.bytecode);
        return (
          <div key={`${f.selector.value}`} className="fn-row">
            <span className={`kind ${kind}`}>{kind}</span>
            <span className="name">selector {f.selector.value}</span>
            <span className="sel">{f.selector.value}</span>
            <span className="size">
              {len !== null ? `${fmtNum(len)} B` : "—"}
            </span>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div className="empty-state">{EMPTY_MESSAGE[kind]}</div>
      )}
    </>
  );
};
