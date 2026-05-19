import {
  type ChicmozL2ContractClassRegisteredEvent,
} from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC, useMemo } from "react";
import { type ChicmozL2ContractInstanceWithAztecScanNotes } from "~/api";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useContractInstancesWithAztecScanNotes,
  useVerifiedSourceContractClasses,
} from "~/hooks/api";
import { truncateHashString } from "~/lib/utils";

const PROJECT_PR_URL =
  "https://github.com/aztec-scan/chicmoz/blob/main/services/explorer-api/src/constants.ts";
const SDK_URL = "https://github.com/aztec-scan/aztec-scan-sdk";

export const EcosystemPage: FC = () => {
  const { data: instances } = useContractInstancesWithAztecScanNotes();
  const { data: classes } = useVerifiedSourceContractClasses();

  const noted: ChicmozL2ContractInstanceWithAztecScanNotes[] = useMemo(
    () => instances ?? [],
    [instances],
  );

  const standardCount = useMemo(
    () => noted.filter((i) => !!i.standardContractType).length,
    [noted],
  );

  const verifiedClasses: ChicmozL2ContractClassRegisteredEvent[] = classes ?? [];

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
              There are five things that add metadata to contracts and contract
              classes: AztecScanNotes, verified contract class artifacts,
              verified source code, verified deployment arguments, and deployer
              details.
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
            <h4>Verified Artifact</h4>
            <p>
              Anyone can submit an Aztec contract artifact for a contract class.
              Aztec Scan checks that the compiled artifact bytecode matches the
              registered on-chain contract class, then stores the artifact and
              contract name for display in the explorer. Please refer to{" "}
              <a href={SDK_URL} target="_blank" rel="noreferrer">
                our SDK
              </a>{" "}
              for more information.
            </p>
            <h4>Verified Source Code</h4>
            <p>
              Verified source code links a contract class to a public GitHub
              repository. Aztec Scan compiles the submitted source, verifies that
              the produced artifact matches the registered on-chain contract
              class, and stores the source URL, commit hash, and source files.
              This verifies a bytecode/source match; it does not mean that the
              code is audited or safe to use.
            </p>
            <h4>Verified Deployment</h4>
            <p>
              Verified deployment checks the deployment arguments for a contract
              instance. Aztec Scan validates the provided public keys, salt,
              deployer, constructor arguments, and artifact against the indexed
              instance and stores those verified deployment arguments for anyone
              to inspect.
            </p>
            <h4>Deployer Details</h4>
            <p>
              Deployer details add human-readable metadata to a verified
              contract instance deployment, such as the contract identifier,
              project details, creator name and contact, app URL, and repo URL.
              These details are accepted together with a successful deployment
              verification and then made visible in the explorer.
            </p>
          </div>
        </details>
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
          <div className="val">{noted.length}</div>
          <div className="sub">listed contracts</div>
        </div>
      </div>

      <div className="section-head">
        <div>
          <h2>
            AztecScanNotes contracts
            <span className="c">· {noted.length} shown</span>
          </h2>

          <p>curated entries maintained by the aztec-scan team</p>
          <div className="disclaimer">
            <span className="warn">⚠ Disclaimer</span>
            The contracts listed here are contracts that aztecscan.xyz has manually
            added with AztecScanNotes. It means they have a known origin —{" "}
            <strong>it does NOT mean they are audited or safe to use</strong>. Do
            your own research before interacting with any of these contracts.
          </div>
        </div>
      </div>

      <div className="eco-grid">
        {noted.map((inst) => {
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
                <span className="tag-chip">{note.origin}</span>
                {isStandard && (
                  <span className="tag-chip">standard</span>
                )}
              </div>
            </Link>
          );
        })}
        {noted.length === 0 && (
          <div className="eco-empty">
            {instances
              ? "no contracts with AztecScanNotes yet"
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
            bytecode matched against on-chain contract class · not an audit or
            safety guarantee
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
