import { type FC, useMemo, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  COMMISSION_FORUM_URL,
  DASHTEC_URL,
  INCIDENTS,
  PAYOUT_AUDIT_URL,
  PROVIDER,
  STAKE_URL,
  type Incident,
} from "./incidents";

const statusLabel = (status: Incident["status"]): string =>
  status === "postmortem" ? "post-mortem" : status;

export const StakingPage: FC = () => {
  const [selectedId, setSelectedId] = useState<string>(INCIDENTS[0].id);
  const selected = useMemo<Incident>(
    () => INCIDENTS.find((i) => i.id === selectedId) ?? INCIDENTS[0],
    [selectedId],
  );

  return (
    <Shell active="staking">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "staking", active: true },
        ]}
        comment="delegate $AZTEC · support the explorer · sequencer post-mortems"
      />

      <div className="stake-hero">
        <div className="pitch">
          <h1>
            Stake to Aztec-Scan
          </h1>
          <p>
            We provide Aztec-Scan services free of charge and open source. Our
            mission is to benefit the entire Aztec ecosystem by building tools
            that everyone can use and contribute to.
          </p>
          <p>
            The best way you can support us is by delegating your{" "}
            <strong style={{ color: "var(--ink-1)" }}>$AZTEC</strong> to our
            Sequencer. This helps us maintain and improve Aztec-Scan while
            contributing to the security and decentralization of the Aztec
            network.
          </p>
          <div className="pitch-cta">
            <a
              className="cta-primary"
              href={STAKE_URL}
              target="_blank"
              rel="noreferrer"
            >
              <span>Stake your $AZTEC</span>
              <span className="arrow">→</span>
            </a>
            <a
              className="cta-secondary"
              href={DASHTEC_URL}
              target="_blank"
              rel="noreferrer"
            >
              Performance on Dashtec
            </a>
          </div>

          <details className="commission-drop">
            <summary>
              <span>
                Current commission: {(PROVIDER.feeBps / 100).toFixed(0)}%
              </span>
              <span className="summary-hint">off-chain audited payouts</span>
            </summary>
            <div className="commission-body">
              <p>
                As per 16/6 we have moved to off-chain payouts. Aztec staking
                commissions are locked into each delegation when the stake is
                created, while operator costs such as Ethereum base fees, blob
                fees, signalling overhead, and infrastructure change over time.
                We are moving our effective commission to the community baseline
                of 25% so operating the aztec-scan sequencer remains
                sustainable.
              </p>
              <p>
                Rewards will be paid through the off-chain audited
                payout flow described in the Aztec forum post. Rewards route to
                an operator-controlled coinbase wallet, then we publish audit
                artifacts so delegators can independently verify weekly payouts
                against on-chain data.
              </p>
              <div className="commission-links">
                <a
                  href={COMMISSION_FORUM_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the commission proposal
                </a>
                <a href={PAYOUT_AUDIT_URL} target="_blank" rel="noreferrer">
                  View our public payout audits
                </a>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="inc-shell">
        <aside className="rail">
          <div className="rail-head">
            <span>Incidents</span>
            <span className="n">{INCIDENTS.length}</span>
          </div>
          {INCIDENTS.map((inc) => (
            <button
              key={inc.id}
              type="button"
              className={"rail-item" + (inc.id === selectedId ? " on" : "")}
              onClick={() => setSelectedId(inc.id)}
            >
              <div className="dt">{inc.dateLabel.toUpperCase()}</div>
              <div className="tt">{inc.title}</div>
              <div className="meta">
                <span className={"sp " + inc.status}>
                  <span className="s-dot" />
                  {statusLabel(inc.status)}
                </span>
                <span className={"sev " + inc.severity}>{inc.severity}</span>
              </div>
            </button>
          ))}
        </aside>

        <section className="detail">
          <header className="detail-head">
            <div className="top">
              <span>incident</span>
              <span className="dot" />
              <span>{selected.id}</span>
              <span className="dot" />
              <span className={"sev " + selected.severity}>
                {selected.severity}
              </span>
              <span className="dot" />
              <span className={"sp " + selected.status}>
                <span className="s-dot" />
                {statusLabel(selected.status)}
              </span>
            </div>
            <h2>{selected.title}</h2>
            <div className="datespan">
              started {selected.startedAt}
              {selected.resolvedAt ? (
                <>
                  {" "}· resolved {selected.resolvedAt} ·{" "}
                  <span style={{ color: "var(--ink-1)" }}>
                    {selected.durationLabel}
                  </span>
                </>
              ) : (
                <>
                  {" "}· <span style={{ color: "#c99800" }}>ongoing</span>
                </>
              )}
            </div>
          </header>

          <div className="detail-body">
            <div className="tldr">
              <div className="tldr-label">TL;DR</div>
              {selected.tldr}
            </div>

            <div className="impact">
              {selected.impact.map((im, i) => (
                <div className="cell" key={i}>
                  <div className="l">{im.label}</div>
                  <div className={"v " + (im.tone || "")}>{im.value}</div>
                </div>
              ))}
            </div>

            <h3>Timeline</h3>
            <div className="timeline">
              {selected.timeline.map((row, i) => (
                <div className="tl-row" key={i}>
                  <span className="t">{row.t}</span>
                  <span className="e">
                    {row.tag && (
                      <span className={"tag " + row.tag}>{row.label}</span>
                    )}
                    {row.text}
                  </span>
                </div>
              ))}
            </div>

            {selected.sections.map((s, i) => (
              <div key={i}>
                <h3>{s.heading}</h3>
                <p>
                  {s.body}
                  {s.hash && (
                    <>
                      {" "}
                      <br />
                      <br />
                      <a href={s.hashHref} target="_blank" rel="noreferrer">
                        <code className="hash">{s.hash}</code>
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
};
