// Tests for the actual onPendingTxs function
// Tests the real implementation with mocked dependencies

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockTxsController,
  mockMessageBus,
  mockLogger,
  createMockAztecTx,
  createMockDbTx,
  resetAllMocks,
} from "../mocks/index.js";

// Constants for grace period testing
const MEMPOOL_SYNC_GRACE_PERIOD_MS = 30000; // 30 seconds

// Helper to create transactions with specific ages
const createMockDbTxWithAge = (
  txHash: string,
  txState: "pending" | "suspected_dropped" | "dropped" | "proposed" | "proven",
  ageMs: number,
  feePayer = "0x1234567890abcdef",
) => {
  const birthTimestamp = new Date(Date.now() - ageMs);
  return createMockDbTx(txHash, txState, birthTimestamp, feePayer);
};

// Mock the dependencies
vi.mock("../../src/svcs/database/index.js", () => ({
  txsController: mockTxsController,
}));

vi.mock("../../src/svcs/message-bus/index.js", () => ({
  publishMessage: mockMessageBus.publishMessage,
}));

vi.mock("../../src/logger.js", () => ({
  logger: mockLogger,
}));

// Import the actual function after setting up mocks
import { onPendingTxs } from "../../src/events/emitted/on-pending-txs.js";

describe("onPendingTxs Function", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should store new transactions as pending", async () => {
    // Setup: Empty database, new transactions in mempool
    const mockAztecTxs = [
      createMockAztecTx("new-tx-1", "0xabc"),
      createMockAztecTx("new-tx-2", "0xdef"),
    ];

    mockTxsController.getTxs.mockResolvedValue([]); // Empty DB
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Execute
    await onPendingTxs(
      // @ts-expect-error - Mock object doesn't implement full Tx interface
      mockAztecTxs
    );

    // Verify
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledTimes(2);
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "new-tx-1" }),
      "pending",
    );
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "new-tx-2" }),
      "pending",
    );
    expect(mockMessageBus.publishMessage).toHaveBeenCalledWith(
      "PENDING_TXS_EVENT",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({ txs: expect.arrayContaining([]) }),
    );
  });

  it("should mark transactions as suspected_dropped only after grace period", async () => {
    // Setup: Transactions in DB with different ages, missing from current mempool
    const storedTxs = [
      createMockDbTx("tx-still-pending", "pending"), // This one is still in mempool
      createMockDbTxWithAge("tx-missing-old", "pending", MEMPOOL_SYNC_GRACE_PERIOD_MS + 5000), // 35 seconds old - beyond grace period
      createMockDbTxWithAge("tx-missing-new", "pending", 15000), // 15 seconds old - within grace period
      createMockDbTx("tx-already-proposed", "proposed"), // Non-pending state
    ];

    const mockAztecTxs = [createMockAztecTx("tx-still-pending", "0xabc")]; // Only one tx still in mempool

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);

    // Execute
    await onPendingTxs(
      // @ts-expect-error - Mock object doesn't implement full Tx interface
      mockAztecTxs
    );

    // Verify: Only the old missing transaction is marked as suspected_dropped (beyond grace period)
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-missing-old" }),
      "suspected_dropped",
    );

    // Verify: Recent missing transaction is NOT marked as suspected_dropped (within grace period)
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-missing-new" }),
      "suspected_dropped",
    );

    // Should not mark already-proposed transactions
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-already-proposed" }),
      "suspected_dropped",
    );
  });

  it("should handle mixed scenario: new txs and suspected dropped txs", async () => {
    // Setup: Some txs in DB, some new txs in mempool, some missing beyond grace period
    const storedTxs = [
      createMockDbTx("existing-tx", "pending"),
      createMockDbTxWithAge("missing-tx-old", "pending", MEMPOOL_SYNC_GRACE_PERIOD_MS + 10000), // 40 seconds old - beyond grace period
      createMockDbTxWithAge("missing-tx-new", "pending", 10000), // 10 seconds old - within grace period
    ];

    const mockAztecTxs = [
      createMockAztecTx("existing-tx", "0xabc"), // Still in mempool
      createMockAztecTx("brand-new-tx", "0xdef"), // New transaction
    ];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Execute
    await onPendingTxs(
      // @ts-expect-error - Mock object doesn't implement full Tx interface
      mockAztecTxs
    );

    // Verify: New tx stored as pending
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "brand-new-tx" }),
      "pending",
    );

    // Verify: Only old missing tx marked as suspected_dropped (beyond grace period)
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "missing-tx-old" }),
      "suspected_dropped",
    );

    // Verify: Recent missing tx is NOT marked as suspected_dropped (within grace period)
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "missing-tx-new" }),
      "suspected_dropped",
    );

    // Verify: Events published
    expect(mockMessageBus.publishMessage).toHaveBeenCalledWith(
      "PENDING_TXS_EVENT",
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        txs: expect.arrayContaining([
          expect.objectContaining({ txHash: "brand-new-tx" }),
        ]),
      }),
    );
  });

  it("should handle empty mempool gracefully with grace period", async () => {
    // Setup: Transactions in DB with different ages, but empty mempool
    const storedTxs = [
      createMockDbTxWithAge("pending-tx-old", "pending", MEMPOOL_SYNC_GRACE_PERIOD_MS + 5000), // 35 seconds old - beyond grace period
      createMockDbTxWithAge("pending-tx-new", "pending", 15000), // 15 seconds old - within grace period
    ];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);

    // Execute with empty mempool
    await onPendingTxs([]);

    // Verify: Only old transaction marked as suspected_dropped (beyond grace period)
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "pending-tx-old" }),
      "suspected_dropped",
    );

    // Verify: Recent transaction is NOT marked as suspected_dropped (within grace period)
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "pending-tx-new" }),
      "suspected_dropped",
    );

    // Verify: No PENDING_TXS_EVENT published (no new txs)
    expect(mockMessageBus.publishMessage).not.toHaveBeenCalled();
  });

  it("should handle grace period boundary correctly", async () => {
    // Setup: Transactions exactly at grace period boundary
    const storedTxs = [
      createMockDbTxWithAge("tx-exactly-at-boundary", "pending", MEMPOOL_SYNC_GRACE_PERIOD_MS), // Exactly 30 seconds old
      createMockDbTxWithAge("tx-just-beyond-boundary", "pending", MEMPOOL_SYNC_GRACE_PERIOD_MS + 100), // Just beyond boundary
      createMockDbTxWithAge("tx-just-within-boundary", "pending", MEMPOOL_SYNC_GRACE_PERIOD_MS - 100), // Just within boundary
    ];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);

    // Execute with empty mempool (all transactions missing)
    await onPendingTxs([]);

    // Verify: Transactions at or beyond grace period are marked as suspected_dropped
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-exactly-at-boundary" }),
      "suspected_dropped",
    );
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-just-beyond-boundary" }),
      "suspected_dropped",
    );

    // Verify: Transaction just within boundary is NOT marked as suspected_dropped
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-just-within-boundary" }),
      "suspected_dropped",
    );
  });

  it("should handle errors gracefully", async () => {
    // Setup: Database error
    mockTxsController.getTxs.mockRejectedValue(
      new Error("Database connection failed"),
    );

    // Execute
    await onPendingTxs([
      // @ts-expect-error - Mock object doesn't implement full Tx interface
      createMockAztecTx("test-tx")
    ]);

    // Verify: Error logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error handling pending txs:",
      expect.any(Error),
    );
  });
});
