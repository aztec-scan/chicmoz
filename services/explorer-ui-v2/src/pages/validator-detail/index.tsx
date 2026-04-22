import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { useL1L2Validator, useL1L2ValidatorHistory } from "~/hooks/api";
import { ageStr, fmtNum, formatFees, toIsoUtc, truncateHashString } from "~/lib/utils";
import { validatorStatusToDisplay } from "~/lib/validator-status";

export const ValidatorDetailPage: FC = () => {
  const { attesterAddress = "" } = useParams({ strict: false });
  const { data: validator, isLoading } = useL1L2Validator(attesterAddress);
  const { data: history } = useL1L2ValidatorHistory(attesterAddress);

  if (isLoading) {
    return (
      <Shell active="validators">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "validators", to: "/validators" },
            {
              label: truncateHashString(attesterAddress, 10, 8),
              active: true,
            },
          ]}
        />
        <div className="panel">
          <div className="empty-state">loading validator…</div>
        </div>
      </Shell>
    );
  }

  if (!validator) {
    return (
      <Shell active="validators">
        <ConsoleHead
          crumbs={[
            { label: "aztec-scan", to: "/" },
            { label: "validators", to: "/validators" },
            {
              label: truncateHashString(attesterAddress, 10, 8),
              active: true,
            },
          ]}
        />
        <div className="panel">
          <div className="empty-state">validator not found</div>
        </div>
      </Shell>
    );
  }

  const status = validatorStatusToDisplay(validator.status);
  const daysSeen = Math.floor(
    (Date.now() - validator.firstSeenAt) / 86400000,
  );

  return (
    <Shell active="validators">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "validators", to: "/validators" },
          {
            label: truncateHashString(validator.attester, 10, 8),
            active: true,
          },
        ]}
        comment={`/api/l1/l2-validators/${truncateHashString(validator.attester, 6, 4)}`}
      />

      <div className="detail-header">
        <div className="kicker">
          Validator · attester address · last change{" "}
          {ageStr(validator.latestSeenChangeAt)}
        </div>
        <h1 className="sans">Validator</h1>
        <div className="subhash">{validator.attester}</div>
        <div className="meta-row">
          <StatusPill status={status} />
          <span className="meta-line">
            staked {formatFees(validator.stake, 18, 2)} · first seen{" "}
            {ageStr(validator.firstSeenAt)}
          </span>
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Current stake</div>
          <div className="val">
            {formatFees(validator.stake, 18, 2)}
            <span className="u">STK</span>
          </div>
          <div className="sub">on-chain</div>
        </div>
        <div className="sc">
          <div className="lbl">Status</div>
          <div className="val" style={{ color: "var(--green)" }}>
            {status}
          </div>
          <div className="sub">latest transition</div>
        </div>
        <div className="sc">
          <div className="lbl">First seen</div>
          <div className="val">
            {daysSeen}
            <span className="u">d</span>
          </div>
          <div className="sub">
            {new Date(validator.firstSeenAt).toISOString().slice(0, 10)}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Lifecycle events</div>
          <div className="val">{fmtNum(history?.length ?? 0)}</div>
          <div className="sub">recorded transitions</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Identity<span className="tag">ChicmozL1L2Validator</span>
          </h3>
        </div>
        <div className="kv-grid">
          <div className="kv wide">
            <span className="k">Attester</span>
            <span className="v">{validator.attester}</span>
          </div>
          <div className="kv wide">
            <span className="k">Withdrawer</span>
            <span className="v">{validator.withdrawer}</span>
          </div>
          <div className="kv wide">
            <span className="k">Proposer</span>
            <span className="v">{validator.proposer}</span>
          </div>
          <div className="kv wide">
            <span className="k">Rollup contract</span>
            <span className="v">{validator.rollupAddress}</span>
          </div>
          <div className="kv wide">
            <span className="k">Stake</span>
            <span className="v">{formatFees(validator.stake, 18, 4)} STK</span>
          </div>
          <div className="kv wide">
            <span className="k">First seen</span>
            <span className="v">{toIsoUtc(validator.firstSeenAt)}</span>
          </div>
          <div className="kv wide">
            <span className="k">Latest change</span>
            <span className="v">
              {toIsoUtc(validator.latestSeenChangeAt)}{" "}
              <span className="mute">
                · {ageStr(validator.latestSeenChangeAt)}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Lifecycle history<span className="tag">/history</span>
          </h3>
        </div>
        <div className="timeline">
          {(history ?? []).map(([ts, prev, next], i) => (
            <div key={i} className="tl-item">
              <div className="tl-date">
                {ts instanceof Date
                  ? ts.toISOString().slice(0, 10)
                  : "—"}
                <br />
                <span style={{ color: "var(--ink-4)" }}>
                  {ts instanceof Date ? ageStr(ts.getTime()) : ""}
                </span>
              </div>
              <div className="tl-node">
                <div className="d" />
              </div>
              <div className="tl-body">
                <div className="evt">
                  status: {prev} → {next}
                </div>
                <div className="desc">active-set transition</div>
              </div>
            </div>
          ))}
          {(!history || history.length === 0) && (
            <div className="empty-state" style={{ padding: 0 }}>
              no lifecycle events yet
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
};
