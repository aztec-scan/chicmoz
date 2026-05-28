import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { useLatestBlock, useL2TipsHealth } from "~/hooks/api";
import { ageStr, fmtNum, truncateHashString } from "~/lib/utils";

/**
 * Hidden dev page at /dev — not linked from navigation.
 * Shows catchup status: DB height vs node tips, degradation reason,
 * and per-bucket progress.
 */
export const CatchupDevPage: FC = () => {
  const { data: tips, error: tipsError } = useL2TipsHealth();
  const { data: latestBlock, error: latestBlockError } = useLatestBlock();

  const dbHeight = latestBlock ? Number(latestBlock.height) : undefined;
  const degraded = tips?.degraded ?? false;
  const degradedReason = tips?.degradedReason;
  const repeatedMismatch = tips?.repeatedDegradedBoundaryMismatch;

  const buckets: {
    label: string;
    tipHeight: number;
    tipHash: string;
  }[] = tips
    ? [
        {
          label: "Proposed",
          tipHeight: tips.tips.proposed.number,
          tipHash: tips.tips.proposed.hash,
        },
        {
          label: "Checkpointed",
          tipHeight: tips.tips.checkpointed.block.number,
          tipHash: tips.tips.checkpointed.block.hash,
        },
        {
          label: "Proven",
          tipHeight: tips.tips.proven.block.number,
          tipHash: tips.tips.proven.block.hash,
        },
        {
          label: "Finalized",
          tipHeight: tips.tips.finalized.block.number,
          tipHash: tips.tips.finalized.block.hash,
        },
      ]
    : [];

  const tipsObservedAge = tips ? ageStr(tips.observedAt) : undefined;
  const tipsTone = degraded
    ? "var(--red)"
    : tips?.stale
      ? "#c99800"
      : "var(--green)";

  return (
    <Shell active="blocks">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "dev catchup", active: true },
        ]}
        comment="/dev — catchup status (not linked from nav)"
      />

      <div className="detail-header">
        <div>
          <div className="kicker">Dev · catchup status</div>
          <h1>Catchup</h1>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--ink-3)",
              marginTop: 4,
            }}
          >
            Not linked from navigation · auto-refreshes
          </div>
        </div>
      </div>

      {/* Hero strip: DB height, node proposed, gap */}
      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">DB latest height</div>
          <div className="val">
            {latestBlockError
              ? "error"
              : dbHeight !== undefined
                ? `#${fmtNum(dbHeight)}`
                : "loading"}
          </div>
          <div className="sub">
            {latestBlock ? truncateHashString(latestBlock.hash) : ""}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Node proposed</div>
          <div className="val" style={{ color: tipsTone }}>
            {tips
              ? `#${fmtNum(tips.tips.proposed.number)}`
              : tipsError
                ? "error"
                : "loading"}
          </div>
          <div className="sub">
            {tips ? truncateHashString(tips.tips.proposed.hash) : ""}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Blocks behind</div>
          <div
            className="val"
            style={{
              color:
                dbHeight !== undefined && tips
                  ? tips.tips.proposed.number - dbHeight > 0
                    ? "var(--red)"
                    : "var(--green)"
                  : undefined,
            }}
          >
            {dbHeight !== undefined && tips
              ? fmtNum(Math.max(0, tips.tips.proposed.number - dbHeight))
              : "—"}
          </div>
          <div className="sub">
            {dbHeight !== undefined && tips
              ? tips.tips.proposed.number === dbHeight
                ? "caught up"
                : `node is ahead by ${tips.tips.proposed.number - dbHeight}`
              : ""}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Tips health</div>
          <div className="val" style={{ color: tipsTone }}>
            {tipsError
              ? "unavailable"
              : degraded
                ? "degraded"
                : tips?.stale
                  ? "stale"
                  : tips
                    ? "fresh"
                    : "loading"}
          </div>
          <div className="sub">
            {tips
              ? `observed ${tipsObservedAge}`
              : tipsError
                ? tipsError.message
                : ""}
          </div>
        </div>
      </div>

      {/* Degradation banner */}
      {degraded && (
        <div
          style={{
            border: "1px solid rgba(255, 80, 80, 0.4)",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            background: "rgba(255, 80, 80, 0.06)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              textTransform: "uppercase",
              color: "var(--red)",
              marginBottom: 6,
            }}
          >
            Tips degraded
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 13,
              color: "var(--ink-1)",
            }}
          >
            {degradedReason ?? "unknown reason"}
          </div>
          {repeatedMismatch && (
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--ink-3)",
                marginTop: 6,
              }}
            >
              bucket: {repeatedMismatch.bucket} · height:{" "}
              {fmtNum(repeatedMismatch.height)} · occurrences:{" "}
              {repeatedMismatch.occurrenceCount} · first seen:{" "}
              {new Date(repeatedMismatch.firstSeenAt).toLocaleString()} · last
              seen: {new Date(repeatedMismatch.lastSeenAt).toLocaleString()}
            </div>
          )}
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--ink-3)",
              marginTop: 6,
            }}
          >
            All blocks show &quot;unknown&quot; status while tips are degraded.
            The listener must ingest the missing boundary block.
          </div>
        </div>
      )}

      {/* Per-bucket progress */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            Tip buckets<span className="tag">/api/l2/tips</span>
          </h3>
        </div>
        <div className="kv-grid">
          {buckets.map((b) => {
            const behind =
              dbHeight !== undefined ? b.tipHeight - dbHeight : undefined;
            const caughtUp = behind !== undefined && behind <= 0;
            return (
              <div key={b.label} className="kv wide">
                <span className="k">{b.label}</span>
                <span
                  className="v"
                  style={{ color: caughtUp ? "var(--green)" : undefined }}
                >
                  <Link
                    to="/blocks/$blockNumber"
                    params={{ blockNumber: String(b.tipHeight) }}
                  >
                    #{fmtNum(b.tipHeight)}
                  </Link>{" "}
                  · {truncateHashString(b.tipHash)}
                  {behind !== undefined && behind > 0 && (
                    <span
                      style={{ color: "var(--red)", marginLeft: 8 }}
                      title={`${behind} blocks behind DB`}
                    >
                      ({fmtNum(behind)} behind DB)
                    </span>
                  )}
                  {caughtUp && (
                    <span style={{ color: "var(--green)", marginLeft: 8 }}>
                      caught up
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {buckets.length === 0 && (
            <div className="empty-state">loading tips…</div>
          )}
        </div>
      </div>

      {/* Source info */}
      {tips && (
        <div className="panel">
          <div className="panel-head">
            <h3>Source</h3>
          </div>
          <div className="kv-grid">
            <div className="kv wide">
              <span className="k">RPC node</span>
              <span className="v">
                {tips.source.rpcNodeName ?? "unknown"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Node version</span>
              <span className="v">
                {tips.source.aztecNodeVersion ?? "unknown"}
              </span>
            </div>
            <div className="kv wide">
              <span className="k">Staleness</span>
              <span className="v" style={{ color: tipsTone }}>
                {fmtNum(tips.stalenessMs)}ms · stale after{" "}
                {fmtNum(tips.staleAfterMs)}ms
              </span>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
};
