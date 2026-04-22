import { Link, useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useContractInstance,
  useContractInstanceBalance,
  useContractInstanceBalanceHistory,
} from "~/hooks/api";
import { ageStr, fmtNum, formatFees, truncateHashString } from "~/lib/utils";

type Tab = "balance" | "history";

export const ContractInstancePage: FC = () => {
  const { address = "" } = useParams({ strict: false });
  const { data: instance, isLoading } = useContractInstance(address);
  const { data: balance } = useContractInstanceBalance(address);
  const { data: history } = useContractInstanceBalanceHistory(address);

  const [tab, setTab] = useState<Tab>("balance");

  if (isLoading) {
    return (
      <Shell active="contracts">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "contracts", to: "/contracts" },
            { label: "instances" },
            { label: truncateHashString(address, 8, 6), active: true },
          ]}
        />
        <div className="panel">
          <div className="empty-state">loading instance…</div>
        </div>
      </Shell>
    );
  }

  if (!instance) {
    return (
      <Shell active="contracts">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "contracts", to: "/contracts" },
            { label: "instances" },
            { label: truncateHashString(address, 8, 6), active: true },
          ]}
        />
        <div className="panel">
          <div className="empty-state">instance not found</div>
        </div>
      </Shell>
    );
  }

  const verified = !!instance.verifiedDeploymentArguments;
  const className =
    instance.artifactContractName ?? instance.standardContractType ?? "Contract";

  const balanceValue = balance?.balance ? formatFees(balance.balance) : "—";

  const maxBal = history?.length
    ? Number(
        history.reduce(
          (m, h) => (h.balance > m ? h.balance : m),
          history[0].balance,
        ),
      )
    : 0;

  const latest = history?.[history.length - 1];
  const prev24 = history?.[Math.max(0, history.length - 25)];
  const delta =
    latest && prev24 ? Number(latest.balance) - Number(prev24.balance) : 0;

  return (
    <Shell active="contracts">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "contracts", to: "/contracts" },
          { label: "instances" },
          { label: truncateHashString(address, 10, 8), active: true },
        ]}
        comment={`/api/l2/contract-instances/${truncateHashString(address, 6, 4)}`}
      />

      <div className="detail-header">
        <div className="kicker">Contract instance</div>
        <h1 className="sans">
          {className}{" "}
          <span
            style={{
              color: "var(--ink-3)",
              fontFamily: "var(--mono)",
              fontSize: 14,
            }}
          >
            · instance
          </span>
        </h1>
        <div className="subhash">{instance.address}</div>
        <div className="meta-row">
          <StatusPill status={verified ? "verified" : "unverified"} />
          <span className="meta-line">
            class{" "}
            <Link
              to="/contracts/classes/$id/versions/$version"
              params={{
                id: instance.contractClassId,
                version: String(instance.version),
              }}
            >
              {truncateHashString(instance.contractClassId, 8, 6)}
            </Link>{" "}
            v{instance.version}
          </span>
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Balance</div>
          <div className="val">
            {balanceValue}
            <span className="u">FJ</span>
          </div>
          <div className="sub">
            {delta === 0
              ? "no change · 24h"
              : delta > 0
                ? `▲ ${fmtNum(delta)} · 24h`
                : `▼ ${fmtNum(Math.abs(delta))} · 24h`}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Class</div>
          <div className="val">{className}</div>
          <div className="sub">v{instance.version}</div>
        </div>
        <div className="sc">
          <div className="lbl">Status</div>
          <div className="val">
            {instance.isOrphaned ? "orphaned" : "active"}
          </div>
          <div className="sub">block state</div>
        </div>
        <div className="sc">
          <div className="lbl">Block</div>
          <div className="val">
            {instance.blockHeight
              ? `#${fmtNum(Number(instance.blockHeight))}`
              : "—"}
          </div>
          <div className="sub">first seen</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Instance header
            <span className="tag">ChicmozL2ContractInstanceDeluxe</span>
          </h3>
        </div>
        <div className="kv-grid">
          <div className="kv extra-wide">
            <span className="k">Address</span>
            <span className="v">{instance.address}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Contract class</span>
            <span className="v">
              <Link
                to="/contracts/classes/$id/versions/$version"
                params={{
                  id: instance.contractClassId,
                  version: String(instance.version),
                }}
              >
                {className} v{instance.version}
              </Link>{" "}
              <span className="mute">· {instance.contractClassId}</span>
            </span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Initialization hash</span>
            <span className="v">{instance.initializationHash}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Deployer</span>
            <span className="v">{instance.deployer}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Salt</span>
            <span className="v">{instance.salt}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Block hash</span>
            <span className="v">{instance.blockHash}</span>
          </div>
          <div className="kv extra-wide">
            <span className="k">Artifact hash</span>
            <span className="v">{instance.artifactHash}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="tabs">
          <button
            className={tab === "balance" ? "on" : ""}
            onClick={() => setTab("balance")}
          >
            Balance
          </button>
          <button
            className={tab === "history" ? "on" : ""}
            onClick={() => setTab("history")}
          >
            Balance history
            <span className="c">{history?.length ?? 0}</span>
          </button>
        </div>
        {tab === "balance" && (
          <div className="balance-block">
            <div className="balance-big">
              {balanceValue}
              <span className="u">FJ</span>
            </div>
            <div className="balance-sub">
              {delta === 0
                ? "no change · 24h"
                : delta > 0
                  ? `+${fmtNum(delta)} · 24h`
                  : `${fmtNum(delta)} · 24h`}{" "}
              · {history?.length ?? 0} snapshots
            </div>
            {history && history.length > 1 && maxBal > 0 && (
              <>
                <div className="spark">
                  {history.map((b, i) => (
                    <div
                      key={i}
                      className="bar"
                      style={{
                        height: `${(Number(b.balance) / maxBal) * 100}%`,
                      }}
                      title={`${formatFees(b.balance)} FJ · ${ageStr(b.timestamp)}`}
                    />
                  ))}
                </div>
                <div className="spark-axis">
                  <span>oldest</span>
                  <span>·</span>
                  <span>now</span>
                </div>
              </>
            )}
          </div>
        )}
        {tab === "history" && (
          <>
            <div className="hist-head">
              <div>Balance (FJ)</div>
              <div className="right">Timestamp</div>
              <div className="right">Age</div>
            </div>
            {(history ?? []).slice().reverse().map((h, i) => (
              <div key={i} className="hist-row">
                <span className="num" style={{ textAlign: "left", color: "var(--ink-1)" }}>
                  {formatFees(h.balance)}
                </span>
                <span className="num">
                  {new Date(h.timestamp)
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ")}
                </span>
                <span className="age">{ageStr(h.timestamp)}</span>
              </div>
            ))}
            {(!history || history.length === 0) && (
              <div className="empty-state">no balance history</div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
};
