import { Link, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useContractClass,
  useContractClassPrivateFunctions,
  useContractClassSource,
  useContractClassUtilityFunctions,
  useDeployedContractInstances,
} from "~/hooks/api";
import { fmtNum, truncateHashString } from "~/lib/utils";

type Tab = "source" | "private" | "utility" | "instances";

export const ContractClassPage: FC = () => {
  const { id: classId = "", version = "" } = useParams({ strict: false });

  const { data: classData, isLoading } = useContractClass({
    classId,
    version,
  });
  const { data: privateFns } = useContractClassPrivateFunctions(classId);
  const { data: utilityFns } = useContractClassUtilityFunctions(classId);
  const { data: instances } = useDeployedContractInstances(classId);
  const { data: source } = useContractClassSource(classId, version);

  const [tab, setTab] = useState<Tab>("source");

  if (isLoading) {
    return (
      <Shell active="contracts">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "contracts", to: "/contracts" },
            { label: "classes" },
            { label: truncateHashString(classId, 8, 6), active: true },
          ]}
        />
        <div className="panel">
          <div className="empty-state">loading contract class…</div>
        </div>
      </Shell>
    );
  }

  if (!classData) {
    return (
      <Shell active="contracts">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "contracts", to: "/contracts" },
            { label: "classes" },
            { label: truncateHashString(classId, 8, 6), active: true },
          ]}
        />
        <div className="panel">
          <div className="empty-state">class not found</div>
        </div>
      </Shell>
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
          <span className="meta-line">
            {instances?.length ?? 0} instances ·{" "}
            {privateFns?.length ?? 0} private fns ·{" "}
            {utilityFns?.length ?? 0} utility fns
          </span>
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Instances</div>
          <div className="val">{fmtNum(instances?.length ?? 0)}</div>
        </div>
        <div className="sc">
          <div className="lbl">Private fns</div>
          <div className="val">{privateFns?.length ?? 0}</div>
        </div>
        <div className="sc">
          <div className="lbl">Utility fns</div>
          <div className="val">{utilityFns?.length ?? 0}</div>
        </div>
        <div className="sc">
          <div className="lbl">Bytecode</div>
          <div className="val">
            {classData.packedBytecode
              ? `${fmtNum(classData.packedBytecode.length)}B`
              : "—"}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Class header
            <span className="tag">chicmozL2ContractClassRegisteredEvent</span>
          </h3>
        </div>
        <div className="kv-grid">
          <div className="kv extra-wide">
            <span className="k">Class ID</span>
            <span className="v">{classData.contractClassId}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Version</span>
            <span className="v">v{classData.version}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Artifact hash</span>
            <span className="v">{classData.artifactHash}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Private fns root</span>
            <span className="v">{classData.privateFunctionsRoot}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Block registered</span>
            <span className="v">
              {classData.blockHash ? (
                <>
                  hash {truncateHashString(classData.blockHash, 14, 12)}
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Standard</span>
            <span className="v">
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
            </span>
          </div>
          {classData.sourceCodeUrl && (
            <div className="kv extra-wide">
              <span className="k">Source</span>
              <span className="v">
                <a href={classData.sourceCodeUrl} target="_blank" rel="noreferrer">
                  {classData.sourceCodeUrl}
                </a>
              </span>
            </div>
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

        {tab === "source" && (
          <div className="source-block">
            <div className="source-meta">
              {source?.sourceCodeUrl && (
                <div>
                  <span className="k">Source</span>
                  <a
                    href={source.sourceCodeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.sourceCodeUrl.replace("https://", "")}
                  </a>
                </div>
              )}
              {source?.sourceCodeCommitHash && (
                <div>
                  <span className="k">Commit</span>
                  {source.sourceCodeCommitHash.slice(0, 8)}
                </div>
              )}
              {source?.aztecVersion && (
                <div>
                  <span className="k">Aztec version</span>
                  {source.aztecVersion}
                </div>
              )}
              {source && (
                <div>
                  <span className="k">Match</span>
                  <span style={{ color: "var(--green)" }}>
                    ● bytecode verified
                  </span>
                </div>
              )}
            </div>
            {source?.sourceCode?.length ? (
              source.sourceCode.slice(0, 3).map((entry, i) => (
                <pre key={`${entry.path}-${i}`} className="code">
                  <span className="cmt">// {entry.path}</span>
                  {"\n"}
                  {entry.content ?? ""}
                </pre>
              ))
            ) : (
              <div
                className="empty-state"
                style={{ background: "var(--bg-1)" }}
              >
                {verified
                  ? "source not yet fetched"
                  : "contract class is unverified — submit source to verify"}
              </div>
            )}
          </div>
        )}

        {tab === "private" && (
          <>
            <div className="fn-head">
              <div>Kind</div>
              <div>Signature</div>
              <div className="right">Selector</div>
              <div className="right">Bytecode</div>
            </div>
            {(privateFns ?? []).map((f) => (
              <div
                key={`${f.privateFunction.selector.value}`}
                className="fn-row"
              >
                <span className="kind priv">priv</span>
                <span className="name">
                  selector {f.privateFunction.selector.value}
                </span>
                <span className="sel">
                  {f.privateFunction.selector.value}
                </span>
                <span className="size">
                  {f.privateFunction.bytecode
                    ? `${fmtNum(f.privateFunction.bytecode.length)} B`
                    : "—"}
                </span>
              </div>
            ))}
            {(!privateFns || privateFns.length === 0) && (
              <div className="empty-state">no private functions broadcast</div>
            )}
          </>
        )}

        {tab === "utility" && (
          <>
            <div className="fn-head">
              <div>Kind</div>
              <div>Signature</div>
              <div className="right">Selector</div>
              <div className="right">Bytecode</div>
            </div>
            {(utilityFns ?? []).map((f) => (
              <div
                key={`${f.utilityFunction.selector.value}`}
                className="fn-row"
              >
                <span className="kind util">util</span>
                <span className="name">
                  selector {f.utilityFunction.selector.value}
                </span>
                <span className="sel">
                  {f.utilityFunction.selector.value}
                </span>
                <span className="size">
                  {f.utilityFunction.bytecode
                    ? `${fmtNum(f.utilityFunction.bytecode.length)} B`
                    : "—"}
                </span>
              </div>
            ))}
            {(!utilityFns || utilityFns.length === 0) && (
              <div className="empty-state">no utility functions broadcast</div>
            )}
          </>
        )}

        {tab === "instances" && (
          <>
            <div className="inst-head">
              <div>Address</div>
              <div className="right">Deployer</div>
              <div className="right">Status</div>
            </div>
            {(instances ?? []).map((i) => (
              <Link
                key={i.address}
                className="inst-row"
                to="/contracts/instances/$address"
                params={{ address: i.address }}
              >
                <span className="hash">{i.address}</span>
                <span className="num">
                  {truncateHashString(i.deployer, 8, 6)}
                </span>
                <span className="age">{i.isOrphaned ? "orphaned" : "active"}</span>
              </Link>
            ))}
            {(!instances || instances.length === 0) && (
              <div className="empty-state">no instances</div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
};
