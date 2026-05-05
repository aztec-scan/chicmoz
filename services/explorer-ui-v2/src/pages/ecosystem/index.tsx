import {
  type AztecScanNoteCategory,
  type ChicmozL2ContractClassRegisteredEvent,
  type ChicmozL2ContractInstanceDeluxe,
  aztecScanNoteCategories,
} from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, useMemo, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useLatestContractInstances,
  useVerifiedSourceContractClasses,
} from "~/hooks/api";
import { truncateHashString } from "~/lib/utils";

type Filter = "all" | AztecScanNoteCategory;

interface NotedInstance extends ChicmozL2ContractInstanceDeluxe {
  aztecScanNotes: NonNullable<ChicmozL2ContractInstanceDeluxe["aztecScanNotes"]>;
}

const hasNote = (i: ChicmozL2ContractInstanceDeluxe): i is NotedInstance =>
  !!i.aztecScanNotes && !!i.aztecScanNotes.name;

const filterNoted = (rows: NotedInstance[], filter: Filter): NotedInstance[] => {
  if (filter === "all") {return rows;}
  return rows.filter((r) => r.aztecScanNotes.category === filter);
};

const PROJECT_PR_URL =
  "https://github.com/aztec-scan/chicmoz/blob/main/services/explorer-api/src/constants.ts";
const SDK_URL = "https://github.com/aztec-scan/aztec-scan-sdk";

export const EcosystemPage: FC = () => {
  const { data: instances } = useLatestContractInstances();
  const { data: classes } = useVerifiedSourceContractClasses();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const noted: NotedInstance[] = useMemo(
    () => (instances ?? []).filter(hasNote),
    [instances],
  );

  const standardCount = useMemo(
    () => noted.filter((i) => !!i.standardContractType).length,
    [noted],
  );

  const verifiedClasses: ChicmozL2ContractClassRegisteredEvent[] = classes ?? [];

  const filtered = useMemo(() => {
    const base = filterNoted(noted, filter);
    if (!query.trim()) {return base;}
    const q = query.trim().toLowerCase();
    return base.filter((i) => {
      const n = i.aztecScanNotes;
      return (
        n.name.toLowerCase().includes(q) ||
        n.origin.toLowerCase().includes(q) ||
        n.comment.toLowerCase().includes(q) ||
        i.address.toLowerCase().includes(q)
      );
    });
  }, [noted, filter, query]);

  const filterCounts = useMemo(() => {
    const counts: Record<Filter, number> = { all: noted.length } as Record<
      Filter,
      number
    >;
    for (const c of aztecScanNoteCategories) {
      counts[c] = noted.filter((i) => i.aztecScanNotes.category === c).length;
    }
    return counts;
  }, [noted]);

  return (
    <Shell active="ecosystem">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "ecosystem", active: true },
        ]}
        comment="curated contracts · verified source · bridges"
      />

      <div className="eco-intro">
        <div className="eyebrow">Building on Aztec</div>
        <h1>A curated directory of contracts and apps on Aztec.</h1>
        <p>
          Welcome to Aztec Scan&apos;s Ecosystem page. Here we list contracts
          with user-uploaded metadata — deployment origin, name, and description
          — to increase discoverability. This is a work in progress; suggestions
          and PRs are very welcome.
        </p>
        <div className="eco-links">
          <a
            className="eco-link"
            href="https://bridge.human.tech/"
            target="_blank"
            rel="noreferrer"
          >
            Bridge via Human Tech <span className="ext">↗</span>
          </a>
          <a
            className="eco-link"
            href="https://bridge.ravenhouse.xyz/"
            target="_blank"
            rel="noreferrer"
          >
            Bridge via Raven House <span className="ext">↗</span>
          </a>
          <a
            className="eco-link"
            href="https://aztec.network/projects"
            target="_blank"
            rel="noreferrer"
          >
            Aztec Ecosystem Projects <span className="ext">↗</span>
          </a>
          <a className="eco-link" href={SDK_URL} target="_blank" rel="noreferrer">
            Aztec-Scan SDK <span className="ext">↗</span>
          </a>
        </div>

        <details className="metadata-accord">
          <summary>
            <span>Want to know more about Aztec Scan&apos;s contract metadata?</span>
            <span className="chev">▾</span>
          </summary>
          <div className="metadata-body">
            <p>
              There are four things that add metadata to contracts:
              AztecScanNotes, uploading an artifact, verifying a deployment, and
              deployer details.
            </p>
            <h4>Aztec Scan Notes</h4>
            <p>
              Aztec Scan Notes are a way to add metadata to contracts on the
              Aztec network. They are manually added by the AztecScan team. If
              you want to have your contract added here,{" "}
              <a href={PROJECT_PR_URL} target="_blank" rel="noreferrer">
                please create a PR to this file
              </a>
              .
            </p>
            <h4>Uploading an Artifact</h4>
            <p>
              Anyone can upload an artifact to a contract. This adds the
              artifact to the contract and makes it available for anyone to
              see. Please refer to{" "}
              <a href={SDK_URL} target="_blank" rel="noreferrer">
                our SDK
              </a>{" "}
              for more information.
            </p>
            <h4>Verified Deployment</h4>
            <p>
              Verified deployment is a way to verify the deployment of a
              contract. This is done by the deployer of the contract. It
              verifies the deployment arguments and makes them available for
              anyone to see.
            </p>
            <h4>Deployer Details</h4>
            <p>
              Deployer details are a way to add metadata to the deployer of a
              contract. This is done by the verified deployer of the contract.
              It adds the contact information and makes it available for anyone
              to see.
            </p>
          </div>
        </details>
      </div>

      <div className="disclaimer">
        <span className="warn">⚠ Disclaimer</span>
        The contracts listed here are contracts that aztecscan.xyz has manually
        added with AztecScanNotes. It means they have a known origin —{" "}
        <strong>it does NOT mean they are audited or safe to use</strong>. Do
        your own research before interacting with any of these contracts.
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Listed projects</div>
          <div className="val">{noted.length}</div>
          <div className="sub">with AztecScanNotes</div>
        </div>
        <div className="sc">
          <div className="lbl">Standard contracts</div>
          <div className="val">{standardCount}</div>
          <div className="sub">known reference deployments</div>
        </div>
        <div className="sc">
          <div className="lbl">Verified source</div>
          <div className="val">{verifiedClasses.length}</div>
          <div className="sub">contract classes</div>
        </div>
        <div className="sc">
          <div className="lbl">Shown</div>
          <div className="val">{filtered.length}</div>
          <div className="sub">after filter</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="tabs-pill">
          {(["all", ...aztecScanNoteCategories] as Filter[]).map((f) => (
            <button
              key={f}
              className={filter === f ? "on" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
              <span className="c">{filterCounts[f]}</span>
            </button>
          ))}
        </div>
        <input
          className="search-inline"
          placeholder="search by name, origin, address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="section-head">
        <div>
          <h2>
            AztecScanNotes contracts
            <span className="c">· {filtered.length} shown</span>
          </h2>
          <p>curated entries maintained by the aztec-scan team</p>
        </div>
      </div>

      <div className="eco-grid">
        {filtered.map((inst) => {
          const note = inst.aztecScanNotes;
          const isStandard = !!inst.standardContractType;
          return (
            <Link
              key={inst.address}
              className="eco-card"
              to="/contracts/instances/$address"
              params={{ address: inst.address }}
            >
              {isStandard && (
                <span className="scroll" title="standard contract">
                  📜
                </span>
              )}
              <div className="head">
                <div>
                  <div className="addr">{truncateHashString(inst.address, 10, 8)}</div>
                  <div className="name">{note.name}</div>
                </div>
              </div>
              <div className="comment">{note.comment}</div>
              <div className="foot">
                {note.category && (
                  <span className="tag-chip tag-chip-ok">{note.category}</span>
                )}
                <span className="tag-chip">{note.origin}</span>
                {isStandard && (
                  <span className="tag-chip">standard</span>
                )}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="eco-empty">
            {instances
              ? "no contracts match · try a different filter or search"
              : "loading…"}
          </div>
        )}
      </div>

      <div className="section-head">
        <div>
          <h2>
            Verified source code
            <span className="c">· {verifiedClasses.length} contract classes</span>
          </h2>
          <p>
            bytecode matched against on-chain contract class · fully
            reproducible
          </p>
        </div>
      </div>

      <div className="eco-grid">
        {verifiedClasses.map((c) => {
          const name =
            c.artifactContractName ?? c.standardContractType ?? "Class";
          return (
            <Link
              key={`${c.contractClassId}-${c.version}`}
              className="eco-card verified"
              to="/contracts/classes/$id/versions/$version"
              params={{
                id: c.contractClassId,
                version: String(c.version),
              }}
            >
              <div className="head">
                <div>
                  <div className="addr">
                    {truncateHashString(c.contractClassId, 10, 8)}
                  </div>
                  <div className="name">
                    <span className="check">✓</span>
                    {name}
                    <span className="ver">v{c.version}</span>
                  </div>
                </div>
              </div>
              {c.sourceCodeUrl && (
                <a
                  className="src-link"
                  href={c.sourceCodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>source ↗</span>
                </a>
              )}
              <div className="foot">
                <span className="tag-chip tag-chip-ok">verified</span>
                <span className="tag-chip">class</span>
              </div>
            </Link>
          );
        })}
        {verifiedClasses.length === 0 && (
          <div className="eco-empty">
            {classes ? "no verified contract classes yet" : "loading…"}
          </div>
        )}
      </div>

      <div className="eco-pr-cta">
        want your contract listed here?{" "}
        <a href={PROJECT_PR_URL} target="_blank" rel="noreferrer">
          open a PR on GitHub ↗
        </a>
      </div>
    </Shell>
  );
};
