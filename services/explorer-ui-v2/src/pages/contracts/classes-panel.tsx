import { type ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { fmtNum, truncateHashString } from "~/lib/utils";
import { Glyph } from "./glyph";

type Filter = "all" | "verified" | "protocol";

const filterRows = (
  rows: ChicmozL2ContractClassRegisteredEvent[],
  filter: Filter,
): ChicmozL2ContractClassRegisteredEvent[] => {
  if (filter === "verified") {
    return rows.filter(
      (r) => !!r.sourceCodeUrl || !!r.artifactJson || !!r.artifactContractName,
    );
  }
  if (filter === "protocol") {
    return rows.filter((r) => !!r.standardContractType);
  }
  return rows;
};

interface Props {
  classes: ChicmozL2ContractClassRegisteredEvent[] | undefined;
}

export const ClassesPanel: FC<Props> = ({ classes }) => {
  const [filter, setFilter] = useState<Filter>("all");
  const list = useMemo(
    () => filterRows(classes ?? [], filter),
    [classes, filter],
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Latest contract classes</h3>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--ink-3)",
            letterSpacing: "0.04em",
            textAlign: "right",
            lineHeight: 1.5,
            maxWidth: 300,
          }}
        >
          Code reference.
          <br />
          Not callable on its own.
        </div>
      </div>
      <div className="filter-bar">
        <span className="lbl">Filter</span>
        {(["all", "verified", "protocol"] as Filter[]).map((f) => (
          <button
            key={f}
            className={"chip" + (filter === f ? " on" : "")}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="contracts-head">
        <div>Class</div>
        <div className="right">Ver</div>
        <div className="right">ID</div>
        <div className="right">Size</div>
      </div>
      {list.slice(0, 14).map((c) => {
        const verified = !!c.sourceCodeUrl;
        const protocol = !!c.standardContractType;
        const name =
          c.artifactContractName ?? c.standardContractType ?? "Class";
        return (
          <Link
            className="contracts-row"
            key={`${c.contractClassId}-${c.version}`}
            to="/contracts/classes/$id/versions/$version"
            params={{
              id: c.contractClassId,
              version: String(c.version),
            }}
          >
            <div className="contract-name">
              <Glyph name={name} verified={verified} protocol={protocol} />
              <div className="cn-text">
                <div className="name">
                  {verified && <span className="verified-dot" />}
                  {name}
                  {protocol && (
                    <span className="contract-tag protocol">protocol</span>
                  )}
                </div>
                <div className="sub">
                  {truncateHashString(c.contractClassId, 8, 6)}
                </div>
              </div>
            </div>
            <div className="right" style={{ color: "var(--ink-2)" }}>
              v{c.version}
            </div>
            <div
              className="right"
              style={{ color: "var(--ink-3)", fontSize: 10 }}
            >
              {truncateHashString(c.contractClassId, 5, 4)}
            </div>
            <div className="right" style={{ color: "var(--ink-3)" }}>
              {c.packedBytecode ? `${fmtNum(c.packedBytecode.length)} B` : "—"}
            </div>
          </Link>
        );
      })}
      {list.length === 0 && (
        <div className="empty-state">no contract classes</div>
      )}
      <div className="panel-foot">
        <div className="count">{list.length} classes</div>
      </div>
    </div>
  );
};
