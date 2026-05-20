import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { Pagination } from "~/components/common";
import { type ContractFilter } from "~/hooks/api/contract";
import { truncateHashString } from "~/lib/utils";
import { Glyph } from "./glyph";

interface Props {
  instances: ChicmozL2ContractInstanceDeluxe[] | undefined;
  totalInstances: number;
  page: number;
  onPageChange: (next: number) => void;
  pageSize: number;
  filter: ContractFilter;
  onFilterChange: (next: ContractFilter) => void;
}

const FILTERS: ContractFilter[] = ["all", "verified", "protocol"];

export const InstancesPanel: FC<Props> = ({
  instances,
  totalInstances,
  page,
  onPageChange,
  pageSize,
  filter,
  onFilterChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalInstances / pageSize));
  const list = instances ?? [];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Latest contract instances</h3>
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
          Deployment with state.
          <br />
          Callable by transactions.
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
      <div className="instances-head">
        <div>Instance</div>
        <div>Class</div>
        <div className="right">Class id</div>
      </div>
      {list.map((inst) => {
        const verified = !!inst.verifiedDeploymentArguments;
        const protocol = !!inst.standardContractType;
        const name =
          inst.artifactContractName ?? inst.standardContractType ?? "Instance";
        return (
          <Link
            className="instances-row"
            key={inst.address}
            to="/contracts/instances/$address"
            params={{ address: inst.address }}
          >
            <div className="contract-name">
              <Glyph name={name} verified={verified} protocol={protocol} />
              <div className="cn-text">
                <div className="name">
                  {verified && <span className="verified-dot" />}
                  <span className="addr">
                    {truncateHashString(inst.address, 8, 6)}
                  </span>
                </div>
                <div className="sub">
                  {inst.isOrphaned ? "orphaned" : "active"}
                </div>
              </div>
            </div>
            <div style={{ color: "var(--ink-2)" }}>{name}</div>
            <div
              className="right"
              style={{ color: "var(--ink-3)", fontSize: 10 }}
            >
              {truncateHashString(inst.contractClassId, 6, 4)}
            </div>
          </Link>
        );
      })}
      {list.length === 0 && (
        <div className="empty-state">no contract instances</div>
      )}
      <div className="panel-foot">
        <div className="count">{totalInstances} instances</div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
