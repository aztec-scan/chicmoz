import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("full-sweep catchup config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults full-sweep catchup off", async () => {
    delete process.env.AZTEC_ENABLE_FULL_SWEEP_CATCHUP;
    delete process.env.AZTEC_DISABLE_ETERNAL_CATCHUP;

    const { AZTEC_ENABLE_FULL_SWEEP_CATCHUP, AZTEC_DISABLE_ETERNAL_CATCHUP } =
      await import("../../src/environment.js");

    expect(AZTEC_ENABLE_FULL_SWEEP_CATCHUP).toBe(false);
    expect(AZTEC_DISABLE_ETERNAL_CATCHUP).toBe(true);
  });

  it("enables full-sweep catchup with the new explicit env var", async () => {
    process.env.AZTEC_ENABLE_FULL_SWEEP_CATCHUP = "true";
    process.env.AZTEC_DISABLE_ETERNAL_CATCHUP = "true";

    const { AZTEC_ENABLE_FULL_SWEEP_CATCHUP, AZTEC_DISABLE_ETERNAL_CATCHUP } =
      await import("../../src/environment.js");

    expect(AZTEC_ENABLE_FULL_SWEEP_CATCHUP).toBe(true);
    expect(AZTEC_DISABLE_ETERNAL_CATCHUP).toBe(false);
  });

  it("keeps legacy rollback behavior when the new env var is unset", async () => {
    delete process.env.AZTEC_ENABLE_FULL_SWEEP_CATCHUP;
    process.env.AZTEC_DISABLE_ETERNAL_CATCHUP = "false";

    const { AZTEC_ENABLE_FULL_SWEEP_CATCHUP, AZTEC_DISABLE_ETERNAL_CATCHUP } =
      await import("../../src/environment.js");

    expect(AZTEC_ENABLE_FULL_SWEEP_CATCHUP).toBe(true);
    expect(AZTEC_DISABLE_ETERNAL_CATCHUP).toBe(false);
  });
});

describe("block poller full-sweep behavior", () => {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  const getBlockHeights = vi.fn();
  const storeBlockHeights = vi.fn();
  const storeProcessedProposedBlockHeight = vi.fn();
  const storeProcessedProvenBlockHeight = vi.fn();
  const getBlock = vi.fn();
  const getLatestProposedHeight = vi.fn();
  const getLatestProvenHeight = vi.fn();
  const onCatchupBlock = vi.fn();
  const onBlock = vi.fn();
  const handleProvenTransactions = vi.fn();

  const importPoller = async (fullSweepEnabled: boolean) => {
    vi.resetModules();
    vi.doMock("../../src/environment.js", () => ({
      AZTEC_ENABLE_FULL_SWEEP_CATCHUP: fullSweepEnabled,
      AZTEC_DISABLE_LISTEN_FOR_PROPOSED_BLOCKS: false,
      AZTEC_DISABLE_LISTEN_FOR_PROVEN_BLOCKS: false,
      BLOCK_POLL_INTERVAL_MS: 60_000,
      CATCHUP_POLL_WAIT_TIME_MS: 0,
    }));
    vi.doMock("../../src/logger.js", () => ({ logger }));
    vi.doMock("../../src/svcs/database/heights.controller.js", () => ({
      getBlockHeights,
      storeBlockHeights,
      storeProcessedProposedBlockHeight,
      storeProcessedProvenBlockHeight,
    }));
    vi.doMock("../../src/svcs/poller/network-client/index.js", () => ({
      getBlock,
      getLatestProposedHeight,
      getLatestProvenHeight,
    }));
    vi.doMock("../../src/events/emitted/index.js", () => ({
      onBlock,
      onCatchupBlock,
    }));
    vi.doMock(
      "../../src/svcs/poller/pollers/block_poller/handle-proven-block-txs.js",
      () => ({ handleProvenTransactions }),
    );

    return import("../../src/svcs/poller/pollers/block_poller/index.js");
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    getLatestProposedHeight.mockResolvedValue(5);
    getLatestProvenHeight.mockResolvedValue(5);
    getBlockHeights.mockResolvedValue({
      processedProposedBlockHeight: 5,
      processedProvenBlockHeight: 5,
      chainProposedBlockHeight: 5,
      chainProvenBlockHeight: 5,
    });
    storeBlockHeights.mockResolvedValue(undefined);
    getBlock.mockResolvedValue({ number: 1 });
    onCatchupBlock.mockResolvedValue(undefined);
    onBlock.mockResolvedValue(undefined);
    handleProvenTransactions.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it("does not call full-sweep catchup when disabled", async () => {
    const poller = await importPoller(false);

    await poller.startPolling();
    await vi.waitFor(() => expect(storeBlockHeights).toHaveBeenCalled());

    expect(getBlock).not.toHaveBeenCalled();
    expect(onCatchupBlock).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "Full-sweep catchup is disabled; request-driven reconciliation is the primary missing-block repair path.",
    );

    poller.stopPolling();
  });

  it("keeps manual full-sweep catchup working when enabled", async () => {
    const poller = await importPoller(true);

    await poller.startPolling();
    await vi.waitFor(() => expect(onCatchupBlock).toHaveBeenCalled());

    expect(getBlock).toHaveBeenCalledWith(1);
    expect(logger.info).toHaveBeenCalledWith(
      "Full-sweep catchup is enabled; listener will sweep historical blocks when live head is idle.",
    );

    poller.stopPolling();
  });
});
