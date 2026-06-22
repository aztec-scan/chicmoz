import type { L2TipsEvent } from "@chicmoz-pkg/message-registry";
import type { ChicmozL2Tips, HexString } from "@chicmoz-pkg/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = {
    selectRows: [] as Array<Array<{ hash?: string } | Record<string, unknown>>>,
    insertValues: [] as unknown[],
    conflictUpdates: [] as unknown[],
  };

  const limit = vi.fn(() => Promise.resolve(state.selectRows.shift() ?? []));
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  const onConflictDoUpdate = vi.fn((args: unknown) => {
    state.conflictUpdates.push(args);
    return Promise.resolve();
  });
  const values = vi.fn((insertValues: unknown) => {
    state.insertValues.push(insertValues);
    return { onConflictDoUpdate };
  });
  const insert = vi.fn(() => ({ values }));

  return {
    db: { insert, select },
    from,
    limit,
    onConflictDoUpdate,
    select,
    state,
    values,
    warn: vi.fn(),
    where,
  };
});

vi.mock("@chicmoz-pkg/postgres-helper", () => ({
  getDb: () => mocks.db,
}));

vi.mock("../../src/environment.js", () => ({
  L2_NETWORK_ID: "SANDBOX",
}));

vi.mock("../../src/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: mocks.warn,
  },
}));

const { deriveNativeStatus, upsertTips } = await import(
  "../../src/svcs/database/controllers/l2/tips.js"
);
const { parseWithFreshNativeStatuses } = await import(
  "../../src/svcs/http-server/routes/controllers/utils/native-status-overlay.js"
);

const hash = (n: number): HexString =>
  `0x${n.toString(16).padStart(2, "0")}` ;

const tips: ChicmozL2Tips = {
  proposed: { number: 100, hash: hash(100) },
  checkpointed: {
    block: { number: 80, hash: hash(80) },
    checkpoint: { number: 8, hash: hash(8) },
  },
  proven: {
    block: { number: 60, hash: hash(60) },
    checkpoint: { number: 6, hash: hash(6) },
  },
  finalized: {
    block: { number: 40, hash: hash(40) },
    checkpoint: { number: 4, hash: hash(4) },
  },
};

const storedTips = {
  ...tips,
  observedAt: 123,
  source: { rpcNodeName: "aztec-node-a", aztecNodeVersion: "4.2.0" },
};

const tipsEvent: L2TipsEvent = {
  tips,
  observedAt: 123,
  source: { rpcNodeName: "aztec-node-a", aztecNodeVersion: "4.2.0" },
};

const l2TipsRow = {
  l2NetworkId: "SANDBOX",
  proposedBlockNumber: tips.proposed.number,
  proposedBlockHash: tips.proposed.hash,
  proposedCheckpointBlockNumber: null,
  proposedCheckpointBlockHash: null,
  proposedCheckpointNumber: null,
  proposedCheckpointHash: null,
  checkpointedBlockNumber: tips.checkpointed.block.number,
  checkpointedBlockHash: tips.checkpointed.block.hash,
  checkpointedCheckpointNumber: tips.checkpointed.checkpoint.number,
  checkpointedCheckpointHash: tips.checkpointed.checkpoint.hash,
  provenBlockNumber: tips.proven.block.number,
  provenBlockHash: tips.proven.block.hash,
  provenCheckpointNumber: tips.proven.checkpoint.number,
  provenCheckpointHash: tips.proven.checkpoint.hash,
  finalizedBlockNumber: tips.finalized.block.number,
  finalizedBlockHash: tips.finalized.block.hash,
  finalizedCheckpointNumber: tips.finalized.checkpoint.number,
  finalizedCheckpointHash: tips.finalized.checkpoint.hash,
  observedAt: 123,
  aztecNodeName: "aztec-node-a",
  aztecNodeVersion: "4.2.0",
  degradedReason: null,
};

beforeEach(() => {
  mocks.state.selectRows = [];
  mocks.state.insertValues = [];
  mocks.state.conflictUpdates = [];
  mocks.warn.mockClear();
  mocks.select.mockClear();
  mocks.from.mockClear();
  mocks.where.mockClear();
  mocks.limit.mockClear();
  mocks.values.mockClear();
  mocks.onConflictDoUpdate.mockClear();
});

describe("deriveNativeStatus", () => {
  it.each([
    [30, "finalized"],
    [50, "proven"],
    [70, "checkpointed"],
    [90, "proposed"],
    [101, "unknown"],
  ] as const)("derives %s as %s from native L2 tips", (height, status) => {
    expect(
      deriveNativeStatus({ hash: hash(height), height: BigInt(height) }, storedTips),
    ).toBe(status);
  });

  it("treats missing, degraded, unsafe, above-tip, and orphaned blocks as unknown", () => {
    expect(deriveNativeStatus({ hash: hash(1), height: 1n }, null)).toBe("unknown");
    expect(
      deriveNativeStatus(
        { hash: hash(1), height: 1n },
        { ...storedTips, degradedReason: "proposed boundary block 100 is missing" },
      ),
    ).toBe("unknown");
    expect(
      deriveNativeStatus(
        { hash: hash(1), height: 1n, orphan: { timestamp: 1, hasOrphanedParent: false } },
        storedTips,
      ),
    ).toBe("unknown");
    expect(
      deriveNativeStatus({ hash: hash(1), height: BigInt(Number.MAX_SAFE_INTEGER) + 1n }, storedTips),
    ).toBe("unknown");
  });

  it("handles Aztec v4 tips where finalized and proven are equal", () => {
    expect(
      deriveNativeStatus(
        { hash: hash(60), height: 60n },
        { ...storedTips, finalized: storedTips.proven },
      ),
    ).toBe("finalized");
  });
});

describe("upsertTips", () => {
  it("stores healthy tips when all boundary blocks exist and hashes match", async () => {
    mocks.state.selectRows = [
      [{ hash: tips.finalized.block.hash }],
      [{ hash: tips.proven.block.hash }],
      [{ hash: tips.checkpointed.block.hash }],
      [{ hash: tips.proposed.hash }],
    ];

    await upsertTips(tipsEvent);

    expect(mocks.state.insertValues).toHaveLength(1);
    expect(mocks.state.insertValues[0]).toMatchObject({
      degradedReason: null,
      finalizedBlockNumber: 40,
      l2NetworkId: "SANDBOX",
      proposedBlockNumber: 100,
    });
    expect(mocks.state.conflictUpdates).toHaveLength(1);
    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it("marks tips degraded when a boundary block is missing", async () => {
    mocks.state.selectRows = [[]];

    await upsertTips(tipsEvent);

    expect(mocks.state.insertValues[0]).toMatchObject({
      degradedReason: "finalized boundary block 40 is missing",
    });
    expect(mocks.warn).toHaveBeenCalledWith(
      "L2 tips degraded: finalized boundary block 40 is missing",
    );
  });

  it("marks tips degraded when a boundary hash mismatches", async () => {
    mocks.state.selectRows = [[{ hash: hash(999) }]];

    await upsertTips(tipsEvent);

    expect(mocks.state.insertValues[0]).toMatchObject({
      degradedReason: `finalized boundary block 40 hash mismatch: db=${hash(999)} tip=${hash(40)}`,
    });
  });
});

describe("native status cache overlay", () => {
  it("recomputes cached block-detail and table payloads from fresh tips", async () => {
    mocks.state.selectRows = [[l2TipsRow]];
    await expect(
      parseWithFreshNativeStatuses(
        JSON.stringify({ hash: hash(90), height: "90", nativeStatus: "unknown" }),
      ),
    ).resolves.toMatchObject({ nativeStatus: "proposed" });

    mocks.state.selectRows = [[l2TipsRow]];
    await expect(
      parseWithFreshNativeStatuses(
        JSON.stringify([{ blockHash: hash(70), height: "70", nativeStatus: "unknown" }]),
      ),
    ).resolves.toEqual([expect.objectContaining({ nativeStatus: "checkpointed" })]);
  });
});
