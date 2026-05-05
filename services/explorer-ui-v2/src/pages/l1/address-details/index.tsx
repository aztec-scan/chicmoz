import { useParams } from "@tanstack/react-router";
import { type FC, useMemo } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { L2ToL1MsgsTable } from "~/components/data/l2-to-l1-msgs-table";
import { useL2ToL1MsgsByRecipient } from "~/hooks/api";
import { fmtNum, truncateHashString } from "~/lib/utils";

export const L1AddressDetailsPage: FC = () => {
  const { address = "" } = useParams({ strict: false });

  const {
    data: messages,
    isLoading,
    error,
  } = useL2ToL1MsgsByRecipient(address);

  const stats = useMemo(() => {
    const msgs = messages ?? [];
    return {
      totalMessages: msgs.length,
      uniqueContracts: new Set(msgs.map((m) => m.contractAddress)).size,
      uniqueTxHashes: new Set(msgs.map((m) => m.txHash)).size,
    };
  }, [messages]);

  return (
    <Shell active="l1events">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "l1" },
          { label: "address", active: true },
          { label: truncateHashString(address, 10, 8), active: true },
        ]}
        comment="L1 recipient · inbound L2 → L1 messages"
      />

      <div className="detail-header">
        <div className="kicker">L1 address · L2 → L1 message activity</div>
        <h1 className="hash-sized">{address}</h1>
        <div className="meta-row">
          <a
            className="etherscan-link"
            href={`https://etherscan.io/address/${address}`}
            target="_blank"
            rel="noreferrer"
          >
            etherscan ↗
          </a>
        </div>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total messages</div>
          <div className="val">{fmtNum(stats.totalMessages)}</div>
          <div className="sub">as L1 recipient</div>
        </div>
        <div className="sc">
          <div className="lbl">Unique contracts</div>
          <div className="val">{fmtNum(stats.uniqueContracts)}</div>
          <div className="sub">L2 contracts</div>
        </div>
        <div className="sc">
          <div className="lbl">Unique tx hashes</div>
          <div className="val">{fmtNum(stats.uniqueTxHashes)}</div>
          <div className="sub">distinct L2 txs</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            L2 → L1 messages
            <span className="c">{stats.totalMessages}</span>
          </h3>
        </div>
        {isLoading ? (
          <div className="empty-state">loading L1 address activity…</div>
        ) : error ? (
          <div className="empty-state" style={{ color: "var(--red)" }}>
            failed to load: {error.message}
          </div>
        ) : (
          <L2ToL1MsgsTable data={messages} omitRecipient />
        )}
      </div>
    </Shell>
  );
};
