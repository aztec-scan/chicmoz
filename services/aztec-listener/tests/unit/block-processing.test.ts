// Tests for the actual onBlock function
// Tests the real implementation with mocked dependencies

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";
import {
  mockTxsController,
  mockMessageBus,
  mockLogger,
  createMockL2Block,
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
import { onBlock } from "../../src/events/emitted/index.js";

describe("onBlock Function", () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllTimers();
  });

  it("should promote pending transactions to proposed when found in proposed block", async () => {
    // Setup: Block with transactions, pending transactions in DB
    const mockBlock = createMockL2Block(100, ["tx-1", "tx-2"]);
    const storedTxs = [
      createMockDbTx("tx-1", "pending"),
      createMockDbTx("tx-2", "suspected_dropped"),
      createMockDbTx("tx-3", "pending"), // Not in block
    ];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Execute with proposed block
    await onBlock(
      mockBlock,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
    );

    // Verify: NEW_BLOCK_EVENT published
    expect(mockMessageBus.publishMessage).toHaveBeenCalledWith(
      "NEW_BLOCK_EVENT",
      expect.objectContaining({
        blockNumber: 100,
        finalizationStatus:
          ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
      }),
    );

    // Verify: Transactions found in block promoted to "proposed"
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-1" }),
      "proposed",
    );
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-2" }),
      "proposed",
    );

    // Verify: Transaction not in block is not updated
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-3" }),
      expect.any(String),
    );
  });

  it("should promote transactions to proven when found in proven block", async () => {
    // Setup: Block with transactions, suspected_dropped transactions in DB
    const mockBlock = createMockL2Block(101, [
      "recovered-tx-1",
      "recovered-tx-2",
    ]);
    const storedTxs = [
      createMockDbTx("recovered-tx-1", "suspected_dropped"),
      createMockDbTx("recovered-tx-2", "pending"),
      createMockDbTx("still-missing", "suspected_dropped"),
    ];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Execute with proven block
    await onBlock(
      mockBlock,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN,
    );

    // Verify: Transactions found in block promoted to "proven"
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "recovered-tx-1" }),
      "proven",
    );
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "recovered-tx-2" }),
      "proven",
    );

    // Verify: Transaction not in block remains unchanged
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "still-missing" }),
      expect.any(String),
    );
  });

  it("should handle empty blocks correctly", async () => {
    // Setup: Empty block, transactions in DB
    const mockBlock = createMockL2Block(102, []); // No transactions
    const storedTxs = [
      createMockDbTx("tx-1", "pending"),
      createMockDbTx("tx-2", "suspected_dropped"),
    ];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Execute
    await onBlock(
      mockBlock,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
    );

    // Verify: Block event published
    expect(mockMessageBus.publishMessage).toHaveBeenCalledWith(
      "NEW_BLOCK_EVENT",
      expect.any(Object),
    );

    // Verify: No transactions updated (empty block)
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalled();
  });

  it("should only check pending and suspected_dropped transactions", async () => {
    // Setup: Block with transactions, but only return pending/suspected_dropped from DB
    const mockBlock = createMockL2Block(103, ["tx-1", "tx-2", "tx-3"]);

    // The function only queries for pending and suspected_dropped, so only return those
    const queriedTxs = [
      createMockDbTx("tx-1", "pending"),
      createMockDbTx("tx-2", "suspected_dropped"),
      // tx-3 is proven/dropped, so won't be returned by the query
    ];

    mockTxsController.getTxs.mockResolvedValue(queriedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Execute
    await onBlock(
      mockBlock,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN,
    );

    // Verify: Only pending and suspected_dropped are queried
    expect(mockTxsController.getTxs).toHaveBeenCalledWith([
      "pending",
      "suspected_dropped",
    ]);

    // Verify: Only the queried transactions that are in the block are updated
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-1" }),
      "proven",
    );
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "tx-2" }),
      "proven",
    );

    // Verify: Only 2 transactions were updated (the ones returned by the query)
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledTimes(2);
  });

  it("should log transaction state changes", async () => {
    // Setup
    const mockBlock = createMockL2Block(104, ["found-tx"]);
    const storedTxs = [createMockDbTx("found-tx", "pending")];

    mockTxsController.getTxs.mockResolvedValue(storedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Execute
    await onBlock(
      mockBlock,
      ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
    );

    // Verify: Appropriate logs generated
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        "✅ Transaction found-tx found in block 104, updated to proposed",
      ),
    );
  });
});
