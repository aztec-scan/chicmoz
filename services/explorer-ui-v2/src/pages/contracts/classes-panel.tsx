import { type ChicmozL2ContractClassRegisteredEvent } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { Pagination } from "~/components/common";
import { type ContractFilter } from "~/hooks/api/contract";
import { fmtNum, truncateHashString } from "~/lib/utils";
import { Glyph } from "./glyph";

interface Props {
  classes: ChicmozL2ContractClassRegisteredEvent[] | undefined;
  totalClasses: number;
  page: number;
  onPageChange: (next: number) => void;
  pageSize: number;
  filter: ContractFilter;
  onFilterChange: (next: ContractFilter) => void;
}

const FILTERS: ContractFilter[] = ["all", "verified", "protocol"];

export const ClassesPanel: FC<Props> = ({
  classes,
  totalClasses,
  page,
  onPageChange,
  pageSize,
  filter,
  onFilterChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalClasses / pageSize));
  const list = classes ?? [];

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
        {FILTERS.map((f) => (
          <button
            key={f}
            className={"chip" + (filter === f ? " on" : "")}
            onClick={() => onFilterChange(f)}
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
      {list.map((c) => {
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
        <div className="count">{totalClasses} classes</div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
