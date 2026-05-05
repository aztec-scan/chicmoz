import { type FC } from "react";
import { fmtNum } from "~/lib/utils";

export interface FunctionEntry {
  selector: { value: number | string };
  bytecode?: { length: number } | unknown[] | null;
}

interface Props {
  kind: "priv" | "util";
  entries: FunctionEntry[] | undefined;
  /**
   * Selector → signature map from the contract class's artifact (e.g.
   * `{"0x86500181": "transfer_from(AztecAddress,AztecAddress,Field,Field)"}`).
   * Older artifacts carry just the bare name; the renderer handles both.
   * Pass `undefined` when no artifact has been uploaded for the class.
   */
  selectorMap?: Record<string, string> | null;
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

/** 4-byte selector number → 0x-prefixed 8-char hex (matches the map keys). */
const selectorToHex = (value: number | string): string => {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) {return "";}
  return "0x" + n.toString(16).padStart(8, "0");
};

export const FunctionsTab: FC<Props> = ({ kind, entries, selectorMap }) => {
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
        const hex = selectorToHex(f.selector.value);
        const signature = selectorMap?.[hex];
        return (
          <div key={`${f.selector.value}`} className="fn-row">
            <span className={`kind ${kind}`}>{kind}</span>
            <span className="name">
              {signature ?? <em>selector {f.selector.value}</em>}
            </span>
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
