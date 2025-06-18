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

  it("should mark transactions as suspected_dropped when missing from mempool", async () => {
    // Setup: Transactions in DB, but missing from current mempool
    const storedTxs = [
      createMockDbTx("tx-still-pending", "pending"),
      createMockDbTx("tx-missing", "pending"),
      createMockDbTx("tx-already-proposed", "proposed"),
    ];

    const mockAztecTxs = [createMockAztecTx("tx-still-pending", "0xabc")]; // Only one tx still in mempool

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);

    // Execute
    await onPendingTxs(
      // @ts-expect-error - Mock object doesn't implement full Tx interface
      mockAztecTxs
    );

    // Verify: Only the missing pending transaction is marked as suspected_dropped
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-missing" }),
      "suspected_dropped",
    );

    // Should not mark already-proposed transactions
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-already-proposed" }),
      "suspected_dropped",
    );
  });

  it("should handle mixed scenario: new txs and suspected dropped txs", async () => {
    // Setup: Some txs in DB, some new txs in mempool, some missing
    const storedTxs = [
      createMockDbTx("existing-tx", "pending"),
      createMockDbTx("missing-tx", "pending"),
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

    // Verify: Missing tx marked as suspected_dropped
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "missing-tx" }),
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

  it("should handle empty mempool gracefully", async () => {
    // Setup: Transactions in DB, but empty mempool
    const storedTxs = [
      createMockDbTx("pending-tx-1", "pending"),
      createMockDbTx("pending-tx-2", "pending"),
    ];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);

    // Execute with empty mempool
    await onPendingTxs([]);

    // Verify: All pending transactions marked as suspected_dropped
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "pending-tx-1" }),
      "suspected_dropped",
    );
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "pending-tx-2" }),
      "suspected_dropped",
    );

    // Verify: No PENDING_TXS_EVENT published (no new txs)
    expect(mockMessageBus.publishMessage).not.toHaveBeenCalled();
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
