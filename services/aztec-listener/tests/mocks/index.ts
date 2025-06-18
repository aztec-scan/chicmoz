// Mock utilities for testing actual functions
import { vi } from "vitest";

// Mock the database controller
export const mockTxsController = {
  getTxs: vi.fn(),
  storeOrUpdate: vi.fn(),
  deleteTx: vi.fn(),
};

// Mock the message bus
export const mockMessageBus = {
  publishMessage: vi.fn(),
  publishMessageSync: vi.fn(),
};

// Mock the network client
export const mockNetworkClient = {
  getPendingTxs: vi.fn(),
  getBlock: vi.fn(),
  getLatestProvenHeight: vi.fn(),
  getLatestProposedHeight: vi.fn(),
};

// Mock the logger
export const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Helper to create mock Aztec Tx objects
export const createMockAztecTx = (
  txHash: string,
  feePayer = "0x1234567890abcdef",
) => ({
  getTxHash: vi.fn().mockResolvedValue({ toString: () => txHash }),
  data: {
    feePayer: { toString: () => feePayer },
  },
});

// Helper to create mock L2Block objects
export const createMockL2Block = (
  blockNumber: number,
  txHashes: string[] = [],
) => ({
  header: {
    globalVariables: {
      blockNumber: BigInt(blockNumber),
    },
  },
  body: {
    txEffects: txHashes.map((hash) => ({
      txHash: { toString: () => hash },
    })),
  },
  hash: vi
    .fn()
    .mockResolvedValue({ toString: () => `block-${blockNumber}-hash` }),
  toString: vi.fn().mockReturnValue(`mock-block-${blockNumber}`),
});

// Helper to create mock database transaction records
export const createMockDbTx = (
  txHash: string,
  txState: "pending" | "suspected_dropped" | "dropped" | "proposed" | "proven",
  birthTimestamp: Date = new Date(),
  feePayer = "0x1234567890abcdef",
) => ({
  txHash,
  feePayer,
  birthTimestamp,
  txState,
});

// Mock modules for vi.mock()
export const mockModules = {
  // Mock the database controller module
  "../../src/svcs/database/index.js": () => ({
    txsController: mockTxsController,
  }),

  // Mock the message bus module
  "../../src/svcs/message-bus/index.js": () => ({
    publishMessage: mockMessageBus.publishMessage,
    publishMessageSync: mockMessageBus.publishMessageSync,
  }),

  // Mock the logger module
  "../../src/logger.js": () => ({
    logger: mockLogger,
  }),

  // Mock the network client module
  "../../src/svcs/poller/network-client/index.js": () => ({
    getBlock: mockNetworkClient.getBlock,
    getLatestProvenHeight: mockNetworkClient.getLatestProvenHeight,
    getLatestProposedHeight: mockNetworkClient.getLatestProposedHeight,
  }),
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  Object.values(mockTxsController).forEach((mock) => mock.mockReset());
  Object.values(mockMessageBus).forEach((mock) => mock.mockReset());
  Object.values(mockNetworkClient).forEach((mock) => mock.mockReset());
  Object.values(mockLogger).forEach((mock) => mock.mockReset());
};

