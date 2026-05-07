import { useParams } from "@tanstack/react-router";
import { type FC } from "react";
import { DetailEmptyState, DetailField, StatusPill } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useChainInfo,
  useL1L2Validator,
  useL1L2ValidatorHistory,
} from "~/hooks/api";
import {
  ageStr,
  fmtNum,
  formatFees,
  getStakingAssetSymbol,
  toIsoUtc,
  truncateHashString,
} from "~/lib/utils";
import { validatorStatusToDisplay } from "~/lib/validator-status";

export const ValidatorDetailPage: FC = () => {
  const { attesterAddress = "" } = useParams({ strict: false });
  const { data: validator, isLoading } = useL1L2Validator(attesterAddress);
  const { data: history } = useL1L2ValidatorHistory(attesterAddress);
  const { data: chainInfo } = useChainInfo();

  const stubCrumbs = [
    { label: "aztec-scan", to: "/" },
    { label: "validators", to: "/validators" },
    { label: truncateHashString(attesterAddress, 10, 8), active: true },
  ];
  if (isLoading) {
    return (
      <DetailEmptyState
        active="validators"
        crumbs={stubCrumbs}
        message="loading validator…"
      />
    );
  }
  if (!validator) {
    return (
      <DetailEmptyState
        active="validators"
        crumbs={stubCrumbs}
        message="validator not found"
      />
    );
  }

  const status = validatorStatusToDisplay(validator.status);
  const daysSeen = Math.floor((Date.now() - validator.firstSeenAt) / 86400000);
  const stakingAssetDecimals = chainInfo?.stakingAssetDecimals ?? 18;
  const stakingAssetSymbol = getStakingAssetSymbol(
    chainInfo?.stakingAssetSymbol,
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
            staked {formatFees(validator.stake, stakingAssetDecimals, 2)} ·
            first seen {ageStr(validator.firstSeenAt)}
          </span>
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Current stake</div>
          <div className="val">
            {formatFees(validator.stake, stakingAssetDecimals, 2)}
            <span className="u">{stakingAssetSymbol}</span>
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
          <DetailField label="Attester" width="wide">
            {validator.attester}
          </DetailField>
          <DetailField label="Withdrawer" width="wide">
            {validator.withdrawer}
          </DetailField>
          <DetailField label="Proposer" width="wide">
            {validator.proposer}
          </DetailField>
          <DetailField label="Rollup contract" width="wide">
            {validator.rollupAddress}
          </DetailField>
          <DetailField label="Stake" width="wide">
            {formatFees(validator.stake, stakingAssetDecimals, 4)}{" "}
            {stakingAssetSymbol}
          </DetailField>
          <DetailField label="First seen" width="wide">
            {toIsoUtc(validator.firstSeenAt)}
          </DetailField>
          <DetailField label="Latest change" width="wide">
            {toIsoUtc(validator.latestSeenChangeAt)}{" "}
            <span className="mute">
              · {ageStr(validator.latestSeenChangeAt)}
            </span>
          </DetailField>
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
                {ts instanceof Date ? ts.toISOString().slice(0, 10) : "—"}
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
