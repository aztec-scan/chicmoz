import { type FC, useMemo, useState } from "react";
import { CopyableAddress } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { useChainInfo, useFeeRecipients } from "~/hooks/api";
import { useSortableTable } from "~/hooks/use-sortable-table";
import { fmtNum, formatFees, truncateHashString } from "~/lib/utils";

type SortKey = "feesReceived" | "nbrOfBlocks" | "share";

export const FeeRecipientsPage: FC = () => {
  const { data: feeRecipients, isLoading } = useFeeRecipients();
  const { data: chainInfo } = useChainInfo();

  const [query, setQuery] = useState("");
  const { sortKey, sortDir, toggleSort, sortArrow } =
    useSortableTable<SortKey>("feesReceived");

  const decimals = chainInfo?.feeJuiceDecimals ?? 18;
  const symbol = chainInfo?.feeJuiceSymbol ?? "FJ";

  const totalReceived = useMemo(() => {
    if (!feeRecipients) {return 0n;}
    return feeRecipients.reduce((acc, r) => acc + r.feesReceived, 0n);
  }, [feeRecipients]);

  const totalBlocks = useMemo(() => {
    if (!feeRecipients) {return 0;}
    return feeRecipients.reduce((acc, r) => acc + r.nbrOfBlocks, 0);
  }, [feeRecipients]);

  const filtered = useMemo(() => {
    let rows = feeRecipients ?? [];
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      rows = rows.filter((r) => r.l2Address.toLowerCase().includes(needle));
    }
    return [...rows].sort((a, b) => {
      const av =
        sortKey === "feesReceived"
          ? a.feesReceived
          : sortKey === "nbrOfBlocks"
            ? BigInt(a.nbrOfBlocks)
            : BigInt(Math.round((a.partOfTotalFeesReceived ?? 0) * 1_000_000));
      const bv =
        sortKey === "feesReceived"
          ? b.feesReceived
          : sortKey === "nbrOfBlocks"
            ? BigInt(b.nbrOfBlocks)
            : BigInt(Math.round((b.partOfTotalFeesReceived ?? 0) * 1_000_000));
      const d = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "asc" ? d : -d;
    });
  }, [feeRecipients, query, sortKey, sortDir]);

  return (
    <Shell active="health">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "fee-recipients", active: true },
        ]}
        comment="addresses that receive L2 block fees"
      />

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Recipients</div>
          <div className="val">{fmtNum(feeRecipients?.length ?? 0)}</div>
          <div className="sub">distinct L2 addresses</div>
        </div>
        <div className="sc">
          <div className="lbl">Total fees received</div>
          <div className="val">
            {formatFees(totalReceived, decimals)}
            <span className="u">{symbol}</span>
          </div>
          <div className="sub">across all recipients</div>
        </div>
        <div className="sc">
          <div className="lbl">Blocks counted</div>
          <div className="val">{fmtNum(totalBlocks)}</div>
          <div className="sub">sum of recipient block counts</div>
        </div>
        <div className="sc">
          <div className="lbl">Rows shown</div>
          <div className="val">{fmtNum(filtered.length)}</div>
          <div className="sub">after filter</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            All recipients
            <span className="c">· {fmtNum(filtered.length)} shown</span>
          </h3>
          <input
            className="search-inline"
            placeholder="filter by address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="table-head fee-recipients-cols">
          <div>Address</div>
          <div
            className="sortable right"
            onClick={() => toggleSort("nbrOfBlocks")}
          >
            Blocks{sortArrow("nbrOfBlocks")}
          </div>
          <div
            className="sortable right"
            onClick={() => toggleSort("feesReceived")}
          >
            Fees ({symbol}){sortArrow("feesReceived")}
          </div>
          <div className="sortable right" onClick={() => toggleSort("share")}>
            Share{sortArrow("share")}
          </div>
        </div>
        <div>
          {filtered.map((r) => {
            const share = r.partOfTotalFeesReceived ?? 0;
            return (
              <div key={r.l2Address} className="trow fee-recipients-cols">
                <span className="addr-cell">
                  <CopyableAddress
                    value={r.l2Address}
                    display={truncateHashString(r.l2Address, 12, 10)}
                    title="Copy recipient address"
                  />
                </span>
                <span className="num">{fmtNum(r.nbrOfBlocks)}</span>
                <span className="num">{formatFees(r.feesReceived, decimals)}</span>
                <span className="num share-cell">
                  <span className="share-bar">
                    <span
                      className="share-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, share * 100)).toFixed(1)}%`,
                      }}
                    />
                  </span>
                  <span>{(share * 100).toFixed(2)}%</span>
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state">
              {isLoading
                ? "loading…"
                : feeRecipients && feeRecipients.length === 0
                  ? "no fee recipients yet"
                  : "no recipients match the filter"}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
};
