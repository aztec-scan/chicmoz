import {
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
} from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useLatestContractClasses,
  useLatestContractInstances,
} from "~/hooks/api";
import { fmtNum, truncateHashString } from "~/lib/utils";

type Filter = "all" | "verified" | "protocol";

const filterClasses = (
  rows: ChicmozL2ContractClassRegisteredEvent[],
  filter: Filter,
): ChicmozL2ContractClassRegisteredEvent[] => {
  if (filter === "verified") {return rows.filter((r) => !!r.sourceCodeUrl);}
  if (filter === "protocol")
    {return rows.filter((r) => !!r.standardContractType);}
  return rows;
};

const filterInstances = (
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

const Glyph: FC<{
  name: string;
  verified?: boolean;
  protocol?: boolean;
}> = ({ name, verified, protocol }) => {
  const letters =
    name.replace(/[a-z]/g, "").slice(0, 2) || name.slice(0, 2).toUpperCase();
  const className =
    "cn-glyph" + (protocol ? " protocol" : verified ? " verified" : "");
  return <div className={className}>{letters || "??"}</div>;
};

export const ContractsPage: FC = () => {
  const { data: classes } = useLatestContractClasses();
  const { data: instances } = useLatestContractInstances();

  const [classFilter, setClassFilter] = useState<Filter>("all");
  const [instanceFilter, setInstanceFilter] = useState<Filter>("all");

  const classList = useMemo(
    () => filterClasses(classes ?? [], classFilter),
    [classes, classFilter],
  );
  const instanceList = useMemo(
    () => filterInstances(instances ?? [], instanceFilter),
    [instances, instanceFilter],
  );

  const totalClasses = classes?.length ?? 0;
  const totalInstances = instances?.length ?? 0;
  const verifiedCount = classes?.filter((c) => !!c.sourceCodeUrl).length ?? 0;
  const protocolCount =
    classes?.filter((c) => !!c.standardContractType).length ?? 0;
  const verifiedPct = totalClasses
    ? Math.round((100 * verifiedCount) / totalClasses)
    : 0;

  return (
    <Shell active="contracts">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "contracts", active: true },
        ]}
        comment="classes (code) + instances (deployments)"
      />

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total contract classes</div>
          <div className="val">{fmtNum(totalClasses)}</div>
          <div className="sub">registered</div>
        </div>
        <div className="sc">
          <div className="lbl">Total instances</div>
          <div className="val">{fmtNum(totalInstances)}</div>
          <div className="sub">across all classes</div>
        </div>
        <div className="sc">
          <div className="lbl">Verified</div>
          <div className="val">
            {verifiedPct}
            <span className="u">%</span>
          </div>
          <div className="sub">of all classes</div>
        </div>
        <div className="sc">
          <div className="lbl">Protocol contracts</div>
          <div className="val">{protocolCount}</div>
          <div className="sub">fee-juice · registry · …</div>
        </div>
      </div>

      <div className="twin">
        {/* Classes panel */}
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
                className={"chip" + (classFilter === f ? " on" : "")}
                onClick={() => setClassFilter(f)}
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
          {classList.slice(0, 14).map((c) => {
            const verified = !!c.sourceCodeUrl;
            const protocol = !!c.standardContractType;
            const name = c.artifactContractName ?? c.standardContractType ?? "Class";
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
                  {c.packedBytecode
                    ? `${fmtNum(c.packedBytecode.length)} B`
                    : "—"}
                </div>
              </Link>
            );
          })}
          {classList.length === 0 && (
            <div className="empty-state">no contract classes</div>
          )}
          <div className="panel-foot">
            <div className="count">{classList.length} classes</div>
          </div>
        </div>

        {/* Instances panel */}
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
                className={"chip" + (instanceFilter === f ? " on" : "")}
                onClick={() => setInstanceFilter(f)}
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
          {instanceList.slice(0, 14).map((inst) => {
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
          {instanceList.length === 0 && (
            <div className="empty-state">no contract instances</div>
          )}
          <div className="panel-foot">
            <div className="count">{instanceList.length} instances</div>
          </div>
        </div>
      </div>
    </Shell>
  );
};
