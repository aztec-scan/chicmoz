import { Link, Outlet, useLocation, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import {
  DetailEmptyState,
  DetailField,
  StatusPill,
} from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useContractClass,
  useContractClassPrivateFunctions,
  useContractClassSource,
  useContractClassUtilityFunctions,
  useDeployedContractInstances,
} from "~/hooks/api";
import { truncateHashString } from "~/lib/utils";
import { FunctionsTab } from "./functions-tab";
import { InstancesTab } from "./instances-tab";
import { SourceTab } from "./source-tab";

type Tab = "source" | "private" | "utility" | "instances";

export const ContractClassPage: FC = () => {
  const { id: classId = "", version = "" } = useParams({ strict: false });
  const location = useLocation();
  const isOnChildRoute = location.pathname.includes(
    "/submit-standard-contract",
  );

  const { data: classData, isLoading } = useContractClass({
    classId,
    version,
  });
  const { data: privateFns } = useContractClassPrivateFunctions(classId);
  const { data: utilityFns } = useContractClassUtilityFunctions(classId);
  const { data: instances } = useDeployedContractInstances(classId);
  const { data: source } = useContractClassSource(classId, version);

  const [tab, setTab] = useState<Tab>("source");

  if (isOnChildRoute) {
    return <Outlet />;
  }

  const stubCrumbs = [
    { label: "aztec-scan", to: "/" },
    { label: "contracts", to: "/contracts" },
    { label: "classes" },
    { label: truncateHashString(classId, 8, 6), active: true },
  ];
  if (isLoading) {
    return (
      <DetailEmptyState
        active="contracts"
        crumbs={stubCrumbs}
        message="loading contract class…"
      />
    );
  }
  if (!classData) {
    return (
      <DetailEmptyState
        active="contracts"
        crumbs={stubCrumbs}
        message="class not found"
      />
    );
  }

  const verified = !!classData.sourceCodeUrl;
  const name =
    classData.artifactContractName ??
    classData.standardContractType ??
    "Contract Class";

  return (
    <Shell active="contracts">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "contracts", to: "/contracts" },
          { label: "classes" },
          { label: name, active: true },
        ]}
        comment={`/api/l2/contract-classes/${truncateHashString(classId, 6, 4)}/versions/${version}`}
      />

      <div className="detail-header">
        <div className="kicker">Contract class · v{version}</div>
        <h1 className="sans">
          {name} <span className="v">v{version}</span>
        </h1>
        <div className="subhash">{classId}</div>
        <div className="meta-row">
          <StatusPill status={verified ? "verified" : "unverified"} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Class header
            <span className="tag">registered class</span>
          </h3>
        </div>
        <div className="kv-grid">
          <DetailField label="Class ID" width="extra-wide">
            {classData.contractClassId}
          </DetailField>
          <DetailField label="Version" width="extra-wide">
            v{classData.version}
          </DetailField>
          <DetailField label="Artifact hash" width="extra-wide">
            {classData.artifactHash}
          </DetailField>
          <DetailField label="Private fns root" width="extra-wide">
            {classData.privateFunctionsRoot}
          </DetailField>
          <DetailField label="Block registered" width="extra-wide">
            {classData.blockHash
              ? `hash ${truncateHashString(classData.blockHash, 14, 12)}`
              : "—"}
          </DetailField>
          <DetailField label="Standard" width="extra-wide">
            {classData.standardContractType ? (
              <>
                {classData.standardContractType}
                {classData.standardContractVersion
                  ? ` · v${classData.standardContractVersion}`
                  : ""}
              </>
            ) : (
              <Link
                to="/contracts/classes/$id/versions/$version/submit-standard-contract"
                params={{
                  id: classData.contractClassId,
                  version: String(classData.version),
                }}
                className="propose-standard-link"
              >
                not set · propose →
              </Link>
            )}
          </DetailField>
          {classData.sourceCodeUrl && (
            <DetailField label="Source" width="extra-wide">
              <a href={classData.sourceCodeUrl} target="_blank" rel="noreferrer">
                {classData.sourceCodeUrl}
              </a>
            </DetailField>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="tabs">
          <button
            className={tab === "source" ? "on" : ""}
            onClick={() => setTab("source")}
          >
            Source
          </button>
          <button
            className={tab === "private" ? "on" : ""}
            onClick={() => setTab("private")}
          >
            Private fns<span className="c">{privateFns?.length ?? 0}</span>
          </button>
          <button
            className={tab === "utility" ? "on" : ""}
            onClick={() => setTab("utility")}
          >
            Utility fns<span className="c">{utilityFns?.length ?? 0}</span>
          </button>
          <button
            className={tab === "instances" ? "on" : ""}
            onClick={() => setTab("instances")}
          >
            Instances<span className="c">{instances?.length ?? 0}</span>
          </button>
        </div>

        {tab === "source" && <SourceTab source={source} verified={verified} />}
        {tab === "private" && (
          <FunctionsTab
            kind="priv"
            entries={privateFns?.map((f) => f.privateFunction)}
            selectorMap={classData.selectorMap}
          />
        )}
        {tab === "utility" && (
          <FunctionsTab
            kind="util"
            entries={utilityFns?.map((f) => f.utilityFunction)}
            selectorMap={classData.selectorMap}
          />
        )}
        {tab === "instances" && <InstancesTab instances={instances} />}
      </div>
    </Shell>
  );
};
