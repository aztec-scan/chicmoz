import { type ChicmozL1GenericContractEvent } from "@chicmoz-pkg/types";
import { type FC, useMemo, useState } from "react";
import { CopyableAddress, Pagination } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { useChainInfo, useL1ContractEvents } from "~/hooks/api";
import { ageStr, fmtNum, truncateHashString } from "~/lib/utils";

const PAGE_SIZE = 25;

type TimeWindow = "24h" | "7d" | "all";
type ContractKey =
  | "all"
  | "rollup"
  | "registry"
  | "inbox"
  | "outbox"
  | "fee-juice";

interface ContractTab {
  key: ContractKey;
  name: string;
  desc: string;
}

const CONTRACT_TABS: ContractTab[] = [
  {
    key: "all",
    name: "All",
    desc: "All events across every rollup L1 contract.",
  },
  {
    key: "rollup",
    name: "Rollup",
    desc: "Core rollup contract. Emits block proposal & proof events; state root anchor.",
  },
  {
    key: "inbox",
    name: "Inbox",
    desc: "L1 → L2 message mailbox. Consumed by the sequencer on every block.",
  },
  {
    key: "outbox",
    name: "Outbox",
    desc: "L2 → L1 message outbox. Users consume messages here to withdraw.",
  },
  {
    key: "fee-juice",
    name: "FeeJuice",
    desc: "L1 fee token portal. Mints & burns FeeJuice for L2 prepayment.",
  },
  {
    key: "registry",
    name: "Registry",
    desc: "Canonical registry of rollup versions & addresses.",
  },
];

/**
 * Colour + semantic bucket for an event name. Events that don't match a known
 * pattern fall into the neutral bucket with a grey bullet.
 */
const EVENT_KIND = (eventName: string): string => {
  const n = eventName.toLowerCase();
  if (n.includes("block") || n.includes("proof") || n.includes("epoch"))
    {return "block";}
  if (n.includes("message") || n.includes("inbox") || n.includes("outbox") || n.includes("root"))
    {return "message";}
  if (n.includes("deposit")) {return "deposit";}
  if (n.includes("withdraw")) {return "withdraw";}
  if (n.includes("slash")) {return "slash";}
  if (n.includes("validator") || n.includes("attester")) {return "validator";}
  if (n.includes("rollup") || n.includes("registry")) {return "registry";}
  return "other";
};

/** Human-ish preview of eventArgs — first 2 keys, values truncated. */
const argsPreview = (
  args: ChicmozL1GenericContractEvent["eventArgs"],
): string => {
  if (!args) {return "—";}
  const entries = Object.entries(args).slice(0, 2);
  if (entries.length === 0) {return "—";}
  return entries
    .map(([k, v]) => `${k}=${formatArgValue(v)}`)
    .join(" · ");
};

const formatArgValue = (v: unknown): string => {
  if (v === null || v === undefined) {return "null";}
  if (typeof v === "bigint") {return v.toString();}
  if (typeof v === "string") {
    if (v.startsWith("0x") && v.length > 20)
      {return truncateHashString(v, 8, 6);}
    return v;
  }
  if (typeof v === "boolean" || typeof v === "number") {return String(v);}
  return "…";
};

const findL2BlockNumber = (
  args: ChicmozL1GenericContractEvent["eventArgs"],
): number | null => {
  if (!args) {return null;}
  const candidates = ["l2BlockNumber", "l2Block", "blockNumber"];
  for (const k of candidates) {
    const v = (args as Record<string, unknown>)[k];
    if (typeof v === "bigint") {return Number(v);}
    if (typeof v === "number" && Number.isFinite(v)) {return v;}
    if (typeof v === "string" && /^\d+$/.test(v)) {return Number(v);}
  }
  return null;
};

const eventTimestampMs = (
  evt: ChicmozL1GenericContractEvent,
): number | null => {
  const ts = evt.l1BlockTimestamp;
  return typeof ts === "number" && Number.isFinite(ts) ? ts : null;
};

export const L1EventsPage: FC = () => {
  const { data: chainInfo } = useChainInfo();
  const { data: events } = useL1ContractEvents();

  const [contractKey, setContractKey] = useState<ContractKey>("all");
  const [eventFilter, setEventFilter] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [window, setWindow] = useState<TimeWindow>("24h");
  const [page, setPage] = useState(0);

  /** Map a ContractKey to an actual L1 address using live chain info. */
  const contractAddrByKey = useMemo<Partial<Record<ContractKey, string>>>(
    () => {
      const a = chainInfo?.l1ContractAddresses;
      return {
        rollup: a?.rollupAddress,
        registry: a?.registryAddress,
        inbox: a?.inboxAddress,
        outbox: a?.outboxAddress,
        "fee-juice": a?.feeJuiceAddress,
      };
    },
    [chainInfo],
  );

  /** Normalise address comparison — both sides lowercased. */
  const matchesContract = (
    evt: ChicmozL1GenericContractEvent,
    key: ContractKey,
  ): boolean => {
    if (key === "all") {return true;}
    const tabAddr = contractAddrByKey[key];
    if (!tabAddr) {return false;}
    return evt.l1ContractAddress.toLowerCase() === tabAddr.toLowerCase();
  };

  const allEvents = events ?? [];

  /** Per-contract event counts. */
  const byContract: Record<ContractKey, number> = useMemo(() => {
    const counts: Record<ContractKey, number> = {
      all: allEvents.length,
      rollup: 0,
      registry: 0,
      inbox: 0,
      outbox: 0,
      "fee-juice": 0,
    };
    allEvents.forEach((e) => {
      (Object.keys(counts) as ContractKey[]).forEach((k) => {
        if (k !== "all" && matchesContract(e, k)) {counts[k] += 1;}
      });
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEvents, chainInfo]);

  /** Event types available in the current contract scope, with counts. */
  const typeCounts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = {};
    allEvents.forEach((e) => {
      if (matchesContract(e, contractKey)) {
        c[e.eventName] = (c[e.eventName] ?? 0) + 1;
      }
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEvents, contractKey, chainInfo]);

  const eventTypesForContract = useMemo(
    () =>
      Object.entries(typeCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([k]) => k),
    [typeCounts],
  );

  const now = Date.now();
  const day = 24 * 3_600_000;
  const cutoff = window === "24h" ? now - day : window === "7d" ? now - 7 * day : 0;

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      if (!matchesContract(e, contractKey)) {return false;}
      if (eventFilter.size > 0 && !eventFilter.has(e.eventName)) {return false;}
      if (cutoff) {
        const ts = eventTimestampMs(e);
        if (ts === null || ts < cutoff) {return false;}
      }
      if (query) {
        const needle = query.toLowerCase();
        return (
          e.eventName.toLowerCase().includes(needle) ||
          (e.l1TransactionHash?.toLowerCase().includes(needle) ?? false) ||
          e.l1BlockNumber.toString().includes(needle) ||
          e.l1ContractAddress.toLowerCase().includes(needle)
        );
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEvents, contractKey, eventFilter, query, cutoff, chainInfo]);

  const last24h = useMemo(
    () =>
      allEvents.filter((e) => {
        const ts = eventTimestampMs(e);
        return ts !== null && ts >= now - day;
      }).length,
    [allEvents, now],
  );
  const last7d = useMemo(
    () =>
      allEvents.filter((e) => {
        const ts = eventTimestampMs(e);
        return ts !== null && ts >= now - 7 * day;
      }).length,
    [allEvents, now],
  );

  /** Sparkline — per-hour bin count over the last 24h. */
  const sparkData = useMemo(() => {
    const bins = Array(24).fill(0) as number[];
    allEvents.forEach((e) => {
      const ts = eventTimestampMs(e);
      if (ts === null) {return;}
      const hoursAgo = Math.floor((now - ts) / 3_600_000);
      if (hoursAgo >= 0 && hoursAgo < 24) {bins[23 - hoursAgo] += 1;}
    });
    return bins;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEvents]);
  const sparkMax = Math.max(...sparkData, 1);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleEvtType = (t: string): void => {
    setEventFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {next.delete(t);}
      else {next.add(t);}
      return next;
    });
    setPage(0);
  };

  const resetAll = (): void => {
    setEventFilter(new Set());
    setQuery("");
    setPage(0);
  };

  const activeContract = CONTRACT_TABS.find((c) => c.key === contractKey);
  const activeAddr =
    contractKey === "all" ? undefined : contractAddrByKey[contractKey];
  const latestEvent = allEvents[0];

  return (
    <Shell active="l1events">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "l1" },
          { label: "contract-events", active: true },
        ]}
        comment="events emitted by rollup L1 contracts on Ethereum"
      />

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Events · 24h</div>
          <div className="val">{fmtNum(last24h)}</div>
          <div className="sub">{(last24h / 24).toFixed(1)} per hour avg</div>
        </div>
        <div className="sc">
          <div className="lbl">Events · 7d</div>
          <div className="val">{fmtNum(last7d)}</div>
          <div className="sub">{(last7d / 7).toFixed(0)} per day avg</div>
        </div>
        <div className="sc">
          <div className="lbl">L1 block · latest</div>
          <div className="val">
            {latestEvent ? fmtNum(latestEvent.l1BlockNumber) : "—"}
          </div>
          <div className="sub">
            {latestEvent
              ? `indexed ${ageStr(eventTimestampMs(latestEvent))}`
              : "no events"}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">Contracts tracked</div>
          <div className="val">{CONTRACT_TABS.length - 1}</div>
          <div className="sub">rollup · inbox · outbox · …</div>
        </div>
      </div>

      <div className="contract-tabs">
        {CONTRACT_TABS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={"ct-btn" + (contractKey === c.key ? " on" : "")}
            onClick={() => {
              setContractKey(c.key);
              setEventFilter(new Set());
              setPage(0);
            }}
          >
            <span className="nm">{c.name}</span>
            <span className="addr">
              {c.key === "all"
                ? "all rollup contracts"
                : contractAddrByKey[c.key]
                  ? truncateHashString(contractAddrByKey[c.key], 6, 4)
                  : "—"}
            </span>
            <span className="count">{fmtNum(byContract[c.key])} events</span>
          </button>
        ))}
      </div>

      {contractKey !== "all" && activeContract && (
        <div className="contract-header">
          <div>
            <div className="nm">
              Rollup <em>·</em> {activeContract.name}
            </div>
            <div className="desc">{activeContract.desc}</div>
            <div className="addr-row">
              <CopyableAddress
                value={activeAddr}
                title={`Copy ${activeContract.name.toLowerCase()} address`}
              />
              {activeAddr && (
                <a
                  href={`https://etherscan.io/address/${activeAddr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="etherscan-link"
                >
                  etherscan ↗
                </a>
              )}
            </div>
          </div>
          <div>
            <div className="spark-label">events · last 24h</div>
            <div className="spark">
              {sparkData.map((n, i) => (
                <span
                  key={i}
                  className="bar"
                  style={{ height: `${(n / sparkMax) * 100}%` }}
                  title={`h-${23 - i}: ${n}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="evt-filter">
        {eventTypesForContract.map((t) => (
          <button
            key={t}
            type="button"
            className={"evt-chip" + (eventFilter.has(t) ? " on" : "")}
            onClick={() => toggleEvtType(t)}
          >
            <span>{t}</span>
            <span className="c">{typeCounts[t] ?? 0}</span>
          </button>
        ))}
        {(eventFilter.size > 0 || query) && (
          <button
            type="button"
            className="evt-chip"
            onClick={resetAll}
            style={{ color: "var(--ink-3)" }}
          >
            × clear
          </button>
        )}
      </div>

      <div className="filters-row">
        <input
          className="search-inline"
          placeholder="filter by event · tx hash · L1 block · address…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          spellCheck={false}
        />
        <div className="time-toggle">
          {(["24h", "7d", "all"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              type="button"
              className={window === w ? "on" : ""}
              onClick={() => {
                setWindow(w);
                setPage(0);
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            Contract events
            <span className="c">· {fmtNum(filtered.length)} shown</span>
          </h3>
          <span className="live-indicator">
            <span className="dot" />
            live
          </span>
        </div>
        <div className="table-head l1-events-cols">
          <div>L1 block</div>
          <div>Event</div>
          <div>L2 context</div>
          <div>Args</div>
          <div className="right">Age</div>
          <div className="right">Tx</div>
        </div>
        <div>
          {paged.map((e) => {
            const l2Block = findL2BlockNumber(e.eventArgs);
            const kind = EVENT_KIND(e.eventName);
            const ts = eventTimestampMs(e);
            const txHref = e.l1TransactionHash
              ? `https://etherscan.io/tx/${e.l1TransactionHash}#eventlog`
              : undefined;
            const row = (
              <>
                <span className="l1b">#{fmtNum(e.l1BlockNumber)}</span>
                <span className={"evt e-" + kind}>
                  <span className="ebullet" />
                  {e.eventName}
                </span>
                <span className="l2ref">
                  {l2Block !== null ? (
                    <>
                      L2 <em>#{fmtNum(l2Block)}</em>
                    </>
                  ) : (
                    <span style={{ color: "var(--ink-4)" }}>—</span>
                  )}
                </span>
                <span className="args">{argsPreview(e.eventArgs)}</span>
                <span className="age">{ageStr(ts)}</span>
                <span className="ex">
                  {e.l1TransactionHash
                    ? `${truncateHashString(e.l1TransactionHash, 4, 4)} ↗`
                    : "—"}
                </span>
              </>
            );
            const key = `${e.l1BlockNumber.toString()}-${e.eventName}-${e.id ?? ""}`;
            return txHref ? (
              <a
                key={key}
                className="trow l1-events-cols"
                href={txHref}
                target="_blank"
                rel="noreferrer"
              >
                {row}
              </a>
            ) : (
              <div key={key} className="trow l1-events-cols">
                {row}
              </div>
            );
          })}
          {paged.length === 0 && (
            <div className="empty-state">
              {events ? "no events match the current filters" : "loading…"}
            </div>
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(n) => setPage(n)}
        />
      </div>

      <div className="eco-pr-cta">
        indexed from Ethereum mainnet by the aztec-scan indexer · updates every
        ~12s
      </div>
    </Shell>
  );
};
