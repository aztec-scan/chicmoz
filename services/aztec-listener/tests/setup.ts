// Test setup file
// Global test configuration and mocks go here

/// <reference types="vitest" />

// Mock environment variables for tests
process.env.L2_NETWORK_ID = "SANDBOX";
process.env.AZTEC_RPC_URLS = JSON.stringify([
  { name: "test-node", url: "http://localhost:8080" },
]);
process.env.DROPPED_TX_VERIFICATION_INTERVAL_MS = "1000"; // 1 second for tests
process.env.DROPPED_TX_AGE_THRESHOLD_MS = "5000"; // 5 seconds for tests
process.env.DROPPED_TX_BLOCK_LOOKBACK = "3"; // 3 blocks for tests
