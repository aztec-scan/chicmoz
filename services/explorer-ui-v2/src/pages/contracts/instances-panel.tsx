import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { truncateHashString } from "~/lib/utils";
import { Glyph } from "./glyph";

type Filter = "all" | "verified" | "protocol";

const filterRows = (
  rows: ChicmozL2ContractInstanceDeluxe[],
  filter: Filter,
): ChicmozL2ContractInstanceDeluxe[] => {
  if (filter === "verified")
    {return rows.filter(
      (r) => !!r.verifiedDeploymentArguments || !!r.deployerMetadata,
    );}
  if (filter === "protocol")
    {return rows.filter((r) => !!r.standardContractType);}
  return rows;
};

interface Props {
  instances: ChicmozL2ContractInstanceDeluxe[] | undefined;
}

export const InstancesPanel: FC<Props> = ({ instances }) => {
  const [filter, setFilter] = useState<Filter>("all");
  const list = useMemo(
    () => filterRows(instances ?? [], filter),
    [instances, filter],
  );

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
      <div className="instances-head">
        <div>Instance</div>
        <div>Class</div>
        <div className="right">Class id</div>
      </div>
      {list.slice(0, 14).map((inst) => {
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
        <div className="count">{list.length} instances</div>
      </div>
    </div>
  );
};
