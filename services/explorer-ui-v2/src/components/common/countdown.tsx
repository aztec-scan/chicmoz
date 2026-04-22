import { type FC } from "react";
import { useReactiveTime } from "~/hooks/use-reactive-time";

interface Props {
  /** Target block cadence in seconds. */
  avgSec: number;
  /** Timestamp (ms) of the latest block — the countdown is measured against this. */
  latestBlockTs: number;
}

/**
 * Live next-block countdown ported from the v2.1 design. Ticks every 100ms,
 * flips to red/pulse when the target is exceeded, and shows "arriving now"
 * in the final 3s window.
 */
export const Countdown: FC<Props> = ({ avgSec, latestBlockTs }) => {
  const now = useReactiveTime(100);
  const avgMs = avgSec * 1000;
  const elapsed = now - latestBlockTs;
  const remaining = avgMs - elapsed;
  const isOverdue = remaining < -3000;
  const isSoon = !isOverdue && remaining < 3000 && remaining >= -3000;
  const pct = Math.min(100, Math.max(0, (elapsed / avgMs) * 100));
  const pctAdj = isOverdue ? 95 + (Math.sin(now / 200) + 1) * 2.5 : pct;
  const sec = Math.abs(remaining) / 1000;
  // The big number to the left already reads as seconds, so the neutral
  // "in Ns" label is redundant. Keep only the two special states that add
  // real signal (arriving / overdue).
  const label = isOverdue ? "overdue" : isSoon ? "arriving now" : "";
  const fillBg = isOverdue
    ? "linear-gradient(90deg, var(--red), #ffb1a7)"
    : "linear-gradient(90deg, var(--purple), var(--purple-soft))";

  return (
    <>
      <div className="countdown-row">
        <div className="kicker">
          Next block
          <em className={isOverdue ? "down" : isSoon ? "" : ""}>
            {isOverdue ? " ● overdue" : isSoon ? " ● soon" : " ● live"}
          </em>
        </div>
        <div className="kicker">target {avgSec}s</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span className="countdown-num">
          {sec.toFixed(1)}
          <span className="unit">s</span>
        </span>
        <span
          className={
            "countdown-state" +
            (isOverdue ? " overdue" : isSoon ? " soon" : "")
          }
        >
          {label}
        </span>
      </div>
      <div className="progress">
        <div
          className="progress-fill"
          style={{ width: `${pctAdj}%`, background: fillBg }}
        />
      </div>
      <div className="progress-ticks">
        <span>0s</span>
        <span>{Math.round(avgSec / 4)}s</span>
        <span>{Math.round(avgSec / 2)}s</span>
        <span>{Math.round((avgSec * 3) / 4)}s</span>
        <span>{avgSec}s</span>
      </div>
    </>
  );
};
