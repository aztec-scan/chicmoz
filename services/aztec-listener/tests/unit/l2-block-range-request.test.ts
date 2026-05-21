import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/environment.js", () => ({
  L2_NETWORK_ID: "SANDBOX",
  L2_BLOCK_RANGE_REQUEST_MAX_AGE_MS: 60 * 60 * 1000,
  L2_BLOCK_RANGE_REQUEST_MAX_BLOCKS: 500,
  L2_BLOCK_RANGE_REQUEST_MAX_RANGES: 2,
  L2_BLOCK_RANGE_REQUEST_MAX_WIDTH: 10,
  L2_BLOCK_RANGE_REQUEST_QUEUE_HIGH_WATER: 10,
  L2_BLOCK_RANGE_REQUEST_QUEUE_MIN_TIME_MS: 0,
}));

vi.mock("../../src/events/emitted/index.js", () => ({
  onCatchupBlock: vi.fn(),
}));

vi.mock("../../src/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../src/svcs/poller/network-client/index.js", () => ({
  getBlock: vi.fn(),
  getLatestProposedHeight: vi.fn(),
  getLatestProvenHeight: vi.fn(),
}));

const { clampRangeRequest, getL2BlockRangeRequestDedupKey } = await import(
  "../../src/events/received/on-l2-block-range-request.js"
);

describe("L2 block range request helpers", () => {
  it("clamps ranges to max width and chain tips", () => {
    const result = clampRangeRequest({
      proposedHeight: 42,
      provenHeight: 20,
      event: {
        requestId: "request-1",
        requestedAt: Date.now(),
        reason: "cadence",
        ranges: [
          { from: 5, to: 100, statusHint: "proposed" },
          { from: 15, to: 50, statusHint: "proven" },
        ],
      },
    });

    expect(result.clampedRanges).toEqual([
      { from: 5, to: 14, statusHint: "proposed" },
      { from: 15, to: 20, statusHint: "proven" },
    ]);
    expect(result.invalidRanges).toEqual([]);
    expect(result.skippedRangeCount).toBe(0);
  });

  it("caps range count and reports invalid ranges", () => {
    const result = clampRangeRequest({
      proposedHeight: 10,
      provenHeight: 10,
      event: {
        requestId: "request-2",
        requestedAt: Date.now(),
        reason: "startup",
        ranges: [
          { from: 12, to: 13 },
          { from: 1, to: 2 },
          { from: 3, to: 4 },
        ],
      },
    });

    expect(result.clampedRanges).toEqual([{ from: 1, to: 2, statusHint: "proposed" }]);
    expect(result.invalidRanges).toEqual([{ from: 12, to: 13 }]);
    expect(result.skippedRangeCount).toBe(1);
  });

  it("builds a network-scoped deduplication key independent of request id", () => {
    const first = getL2BlockRangeRequestDedupKey({
      requestId: "a",
      requestedAt: 1,
      reason: "cadence",
      ranges: [{ from: 1, to: 3 }],
    });
    const second = getL2BlockRangeRequestDedupKey({
      requestId: "b",
      requestedAt: 2,
      reason: "cadence",
      ranges: [{ from: 1, to: 3, statusHint: "proposed" }],
    });

    expect(first).toBe(second);
    expect(first).toBe("SANDBOX:cadence:1-3-proposed");
  });
});
