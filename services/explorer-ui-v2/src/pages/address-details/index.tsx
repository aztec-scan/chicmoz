import { useParams } from "@tanstack/react-router";
import { type FC, useMemo } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import { PublicCallRequestsTable } from "~/components/data/public-call-requests-table";
import { usePublicCallRequestsBySender } from "~/hooks/api";
import { fmtNum, truncateHashString } from "~/lib/utils";

export const AddressDetailsPage: FC = () => {
  const { address = "" } = useParams({ strict: false });

  const {
    data: publicCallRequests,
    isLoading,
    error,
  } = usePublicCallRequestsBySender(address);

  const stats = useMemo(() => {
    const calls = publicCallRequests ?? [];
    return {
      totalCalls: calls.length,
      uniqueContracts: new Set(calls.map((c) => c.contractAddress)).size,
      staticCalls: calls.filter((c) => c.isStaticCall).length,
    };
  }, [publicCallRequests]);

  return (
    <Shell>
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "address", active: true },
          { label: truncateHashString(address, 10, 8), active: true },
        ]}
        comment="L2 account activity"
      />

      <div className="detail-header">
        <div className="kicker">L2 address · public call activity</div>
        <h1 className="hash-sized">{address}</h1>
      </div>

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total calls</div>
          <div className="val">{fmtNum(stats.totalCalls)}</div>
          <div className="sub">as msg sender</div>
        </div>
        <div className="sc">
          <div className="lbl">Unique contracts</div>
          <div className="val">{fmtNum(stats.uniqueContracts)}</div>
          <div className="sub">contracts called</div>
        </div>
        <div className="sc">
          <div className="lbl">Static calls</div>
          <div className="val">{fmtNum(stats.staticCalls)}</div>
          <div className="sub">read-only</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Public call requests
            <span className="c">{stats.totalCalls}</span>
          </h3>
        </div>
        {isLoading ? (
          <div className="empty-state">loading address activity…</div>
        ) : error ? (
          <div className="empty-state" style={{ color: "var(--red)" }}>
            failed to load: {error.message}
          </div>
        ) : (
          <PublicCallRequestsTable data={publicCallRequests} omitSender />
        )}
      </div>
    </Shell>
  );
};
