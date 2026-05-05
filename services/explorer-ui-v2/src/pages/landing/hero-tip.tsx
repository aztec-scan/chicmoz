import { type ChicmozChainInfo, type ChicmozL2BlockLight } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { Countdown } from "~/components/common";
import { blockStatusToDisplay } from "~/lib/block-status";
import { ageStr, fmtNum, truncateHashString } from "~/lib/utils";
import { BLOCK_TIME_TARGET_SECONDS } from "~/service/constants";

interface Props {
  latestBlock: ChicmozL2BlockLight | undefined;
  blocksByStatus: ChicmozL2BlockLight[] | undefined;
  chainInfo: ChicmozChainInfo | undefined;
  averageBlockTime: number | string | undefined;
}

const STATUS_LABEL: Record<string, string> = {
  proposed: "proposed · awaiting proof",
  proven: "proven",
  finalized: "finalized",
  orphaned: "orphaned",
  pending: "pending",
};

export const HeroTip: FC<Props> = ({
  latestBlock,
  blocksByStatus,
  chainInfo,
  averageBlockTime,
}) => {
  const latestTs =
    latestBlock?.header?.globalVariables?.timestamp !== undefined
      ? Number(latestBlock.header.globalVariables.timestamp)
      : Date.now();
  const latestHeight = latestBlock?.height
    ? Number(latestBlock.height)
    : undefined;
  const latestHash = latestBlock?.hash;
  const latestStatus = blockStatusToDisplay(
    latestBlock?.finalizationStatus,
    !!latestBlock?.orphan,
  );

  const provenHead = blocksByStatus?.find((b) => {
    const s = blockStatusToDisplay(b.finalizationStatus, !!b.orphan);
    return s === "proven" || s === "finalized";
  });
  const finalized = blocksByStatus?.find(
    (b) => blockStatusToDisplay(b.finalizationStatus, !!b.orphan) === "finalized",
  );

  const avgSec = averageBlockTime
    ? Math.max(1, Math.round(Number(averageBlockTime) / 1000))
    : BLOCK_TIME_TARGET_SECONDS;

  return (
    <div className="tip">
      <div className="tip-cell accent">
        <span className="rail" />
        <div className="kicker">
          Latest block<em>● live</em>
        </div>
        <div className="hh">
          {latestHeight !== undefined ? (
            <Link
              to="/blocks/$blockNumber"
              params={{ blockNumber: String(latestHeight) }}
            >
              <span className="pfx">#</span>
              {fmtNum(latestHeight)}
            </Link>
          ) : (
            <>
              <span className="pfx">#</span>—
            </>
          )}
        </div>
        <div className="sub">
          <div className="kv-line">
            <span className="k">hash</span>
            <span className="v">
              {latestHash && latestHeight !== undefined ? (
                <Link
                  to="/blocks/$blockNumber"
                  params={{ blockNumber: String(latestHeight) }}
                >
                  {truncateHashString(latestHash, 14, 12)}
                </Link>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="kv-line">
            <span className="k">status</span>
            <span className="v">{STATUS_LABEL[latestStatus]}</span>
          </div>
          <div className="kv-line">
            <span className="k">age</span>
            <span className="v">{ageStr(latestTs)}</span>
          </div>
        </div>
      </div>

      <div className="tip-cell">
        <div className="kicker">Proven head</div>
        <div className="count">
          {provenHead?.height !== undefined
            ? `#${fmtNum(Number(provenHead.height))}`
            : "—"}
        </div>
        <div className="delta">
          {provenHead?.height !== undefined && latestHeight !== undefined
            ? `${Math.max(0, latestHeight - Number(provenHead.height))} blocks behind tip`
            : "awaiting proof"}
        </div>
        <div className="sub" style={{ marginTop: 14 }}>
          <div className="kv-line">
            <span className="k">finalized</span>
            <span className="v">
              {finalized?.height !== undefined
                ? `#${fmtNum(Number(finalized.height))}`
                : "—"}
            </span>
          </div>
          <div className="kv-line">
            <span className="k">L1 chain</span>
            <span className="v">
              ethereum · id {chainInfo?.l1ChainId ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="tip-cell">
        <Countdown avgSec={avgSec} latestBlockTs={latestTs} />
      </div>
    </div>
  );
};
