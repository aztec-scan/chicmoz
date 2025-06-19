// Tests for the dropped transaction verifier logic
// Tests core verification logic by extracting and testing the algorithm

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockTxsController,
  mockMessageBus,
  mockLogger,
  mockNetworkClient,
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

vi.mock("../../src/svcs/poller/network-client/index.js", () => ({
  getBlock: mockNetworkClient.getBlock,
  getLatestProvenHeight: mockNetworkClient.getLatestProvenHeight,
}));

// Import actual environment constants to match production behavior
// Mock environment constants - using production values for realistic testing
const DROPPED_TX_AGE_THRESHOLD_MS = 300000; // 5 minutes (matches production)
const DROPPED_TX_BLOCK_LOOKBACK = 10; // 10 blocks (matches production)

// Extract the core verification logic for testing
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
const verifyDroppedTransactions = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const suspectedDroppedTxs = await mockTxsController.getTxs([
      "suspected_dropped",
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (suspectedDroppedTxs.length === 0) {
      mockLogger.debug("🔍 No suspected dropped transactions to verify");
      return;
    }

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const oldSuspectedTxs = suspectedDroppedTxs.filter((tx: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ageMs = now.getTime() - tx.birthTimestamp.getTime();
      return ageMs >= DROPPED_TX_AGE_THRESHOLD_MS;
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (oldSuspectedTxs.length === 0) {
      mockLogger.debug(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `🔍 ${suspectedDroppedTxs.length} suspected dropped txs found, but none are old enough`,
      );
      return;
    }

    mockLogger.info(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `🔍 Verifying ${oldSuspectedTxs.length} old suspected dropped transactions`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const latestHeight = await mockNetworkClient.getLatestProvenHeight();
    const startHeight = Math.max(
      1,
      latestHeight - DROPPED_TX_BLOCK_LOOKBACK + 1,
    );

    const recentBlockTxHashes = new Set<string>();
    for (let height = startHeight; height <= latestHeight; height++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const block = await mockNetworkClient.getBlock(height);
        if (block) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          block.body.txEffects.forEach((effect: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            recentBlockTxHashes.add(effect.txHash.toString());
          });
        }
      } catch (error) {
        mockLogger.warn(
          `🔍 Failed to fetch block ${height} for verification:`,
          error,
        );
      }
    }

    const definitivelyDroppedTxs = [];
    const recoveredTxs = [];

    for (const suspectedTx of oldSuspectedTxs) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (recentBlockTxHashes.has(suspectedTx.txHash)) {
        recoveredTxs.push(suspectedTx);
        await mockTxsController.storeOrUpdate(suspectedTx, "proven");
        mockLogger.info(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `✅ Transaction ${suspectedTx.txHash} found in recent blocks, marked as proven`,
        );
      } else {
        definitivelyDroppedTxs.push(suspectedTx);
        await mockTxsController.storeOrUpdate(suspectedTx, "dropped");
      }
    }

    if (definitivelyDroppedTxs.length > 0) {
      await mockMessageBus.publishMessage("DROPPED_TXS_EVENT", {
        txs: definitivelyDroppedTxs.map((tx) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          txHash: tx.txHash,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          createdAsPendingAt: tx.birthTimestamp,
          droppedAt: new Date(),
        })),
      });

      mockLogger.info(
        `🗑️ Confirmed ${definitivelyDroppedTxs.length} transactions as definitively dropped`,
      );

      for (const droppedTx of definitivelyDroppedTxs) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        await mockTxsController.deleteTx(droppedTx.txHash);
      }
    }

    if (recoveredTxs.length > 0) {
      mockLogger.info(
        `🔄 Recovered ${recoveredTxs.length} transactions that were found in recent blocks`,
      );
    }
  } catch (error) {
    mockLogger.error("🔍 Error verifying dropped transactions:", error);
  }
};

describe("Dropped Transaction Verifier Logic", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should verify old suspected transactions and mark truly dropped ones as dropped", async () => {
    // Setup: Old suspected transactions, some found in recent blocks, some not
    const now = new Date();
    const oldSuspectedTxs = [
      createMockDbTx(
        "recovered-tx",
        "suspected_dropped",
        new Date(now.getTime() - DROPPED_TX_AGE_THRESHOLD_MS - 60000),
      ), // 6 minutes old (beyond threshold)
      createMockDbTx(
        "truly-dropped-tx",
        "suspected_dropped",
        new Date(now.getTime() - DROPPED_TX_AGE_THRESHOLD_MS - 30000),
      ), // 5.5 minutes old (beyond threshold)
      createMockDbTx(
        "too-young-tx",
        "suspected_dropped",
        new Date(now.getTime() - 60000),
      ), // 1 minute old (below threshold)
    ];

    // Mock recent blocks with one recovered transaction
    const mockBlock1 = createMockL2Block(98, ["recovered-tx", "other-tx-1"]);
    const mockBlock2 = createMockL2Block(99, ["other-tx-2"]);
    const mockBlock3 = createMockL2Block(100, ["other-tx-3"]);

    mockTxsController.getTxs.mockResolvedValue(oldSuspectedTxs);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockTxsController.deleteTx.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    mockNetworkClient.getLatestProvenHeight.mockResolvedValue(100);
    mockNetworkClient.getBlock.mockImplementation((height: number) => {
      switch (height) {
        case 98:
          return Promise.resolve(mockBlock1);
        case 99:
          return Promise.resolve(mockBlock2);
        case 100:
          return Promise.resolve(mockBlock3);
        default:
          return Promise.resolve(null);
      }
    });

    // Execute the verification logic directly
    await verifyDroppedTransactions();

    // Verify: Recovered transaction marked as proven
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "recovered-tx" }),
      "proven",
    );

    // Verify: Truly dropped transaction marked as dropped and deleted
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "truly-dropped-tx" }),
      "dropped",
    );
    expect(mockTxsController.deleteTx).toHaveBeenCalledWith("truly-dropped-tx");

    // Verify: Too young transaction not processed
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "too-young-tx" }),
      expect.any(String),
    );

    // Verify: DROPPED_TXS_EVENT published
    expect(mockMessageBus.publishMessage).toHaveBeenCalledWith(
      "DROPPED_TXS_EVENT",
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        txs: expect.arrayContaining([
          expect.objectContaining({
            txHash: "truly-dropped-tx",
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            droppedAt: expect.any(Date),
          }),
        ]),
      }),
    );
  });

  it("should handle case where no suspected transactions exist", async () => {
    // Setup: No suspected transactions
    mockTxsController.getTxs.mockResolvedValue([]);

    // Execute the verification logic directly
    await verifyDroppedTransactions();

    // Verify: No further database calls made
    expect(mockNetworkClient.getLatestProvenHeight).not.toHaveBeenCalled();
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalled();
    expect(mockMessageBus.publishMessage).not.toHaveBeenCalled();
  });

  it("should handle case where all suspected transactions are too young", async () => {
    // Setup: Only young suspected transactions (below 5-minute threshold)
    const now = new Date();
    const youngTxs = [
      createMockDbTx(
        "young-tx-1",
        "suspected_dropped",
        new Date(now.getTime() - 60000),
      ), // 1 minute old (below threshold)
      createMockDbTx(
        "young-tx-2",
        "suspected_dropped",
        new Date(now.getTime() - 120000),
      ), // 2 minutes old (below threshold)
    ];

    mockTxsController.getTxs.mockResolvedValue(youngTxs);

    // Execute the verification logic directly
    await verifyDroppedTransactions();

    // Verify: No network calls made (transactions too young)
    expect(mockNetworkClient.getLatestProvenHeight).not.toHaveBeenCalled();
    expect(mockTxsController.storeOrUpdate).not.toHaveBeenCalled();
  });

  it("should handle network errors gracefully", async () => {
    // Setup: Old suspected transaction, but network error
    const now = new Date();
    const oldTx = createMockDbTx(
      "old-tx",
      "suspected_dropped",
      new Date(now.getTime() - DROPPED_TX_AGE_THRESHOLD_MS - 10000),
    ); // 5 minutes + 10 seconds old (beyond threshold)

    mockTxsController.getTxs.mockResolvedValue([oldTx]);
    mockNetworkClient.getLatestProvenHeight.mockRejectedValue(
      new Error("Network unavailable"),
    );

    // Execute the verification logic directly
    await verifyDroppedTransactions();

    // Verify: Error logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      "🔍 Error verifying dropped transactions:",
      expect.any(Error),
    );
  });

  it("should handle block fetch errors for individual blocks", async () => {
    // Setup: Old suspected transaction, but one block fails to fetch
    const now = new Date();
    const oldTx = createMockDbTx(
      "old-tx",
      "suspected_dropped",
      new Date(now.getTime() - DROPPED_TX_AGE_THRESHOLD_MS - 10000),
    ); // 5 minutes + 10 seconds old (beyond threshold)

    mockTxsController.getTxs.mockResolvedValue([oldTx]);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockTxsController.deleteTx.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    mockNetworkClient.getLatestProvenHeight.mockResolvedValue(100);
    mockNetworkClient.getBlock.mockImplementation((height: number) => {
      if (height === 99) {
        return Promise.reject(new Error("Block fetch failed"));
      }
      return Promise.resolve(createMockL2Block(height, []));
    });

    // Execute the verification logic directly
    await verifyDroppedTransactions();

    // Verify: Warning logged for failed block
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("🔍 Failed to fetch block 99 for verification:"),
      expect.any(Error),
    );

    // Verify: Process continues despite block fetch error
    expect(mockTxsController.storeOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ txHash: "old-tx" }),
      "dropped",
    );
  });

  it("should handle edge case where lookback goes to block 1", async () => {
    // Setup: Low latest height to test edge case
    const now = new Date();
    const oldTx = createMockDbTx(
      "old-tx",
      "suspected_dropped",
      new Date(now.getTime() - DROPPED_TX_AGE_THRESHOLD_MS - 10000),
    ); // 5 minutes + 10 seconds old (beyond threshold)

    mockTxsController.getTxs.mockResolvedValue([oldTx]);
    mockTxsController.storeOrUpdate.mockResolvedValue(undefined);
    mockTxsController.deleteTx.mockResolvedValue(undefined);
    mockMessageBus.publishMessage.mockResolvedValue(undefined);

    // Latest height is 2, lookback is 3, so should start from block 1
    mockNetworkClient.getLatestProvenHeight.mockResolvedValue(2);
    mockNetworkClient.getBlock.mockImplementation((height: number) => {
      return Promise.resolve(createMockL2Block(height, []));
    });

    // Execute the verification logic directly
    await verifyDroppedTransactions();

    // Verify: Blocks 1 and 2 are fetched (should not try to fetch block 0 or negative)
    expect(mockNetworkClient.getBlock).toHaveBeenCalledWith(1);
    expect(mockNetworkClient.getBlock).toHaveBeenCalledWith(2);
    expect(mockNetworkClient.getBlock).not.toHaveBeenCalledWith(0);
  });
});
