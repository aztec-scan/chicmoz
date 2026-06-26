import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("../../src/logger.js", () => ({
  logger: mocks,
}));

const { handleDuplicateBlockError } = await import(
  "../../src/events/received/utils.js"
);

beforeEach(() => {
  mocks.error.mockClear();
  mocks.info.mockClear();
  mocks.warn.mockClear();
});

describe("handleDuplicateBlockError", () => {
  it("uses the tx owner resolver for duplicate tx_hash errors", async () => {
    const deleteIncomingHeight = vi.fn<() => Promise<void>>(() =>
      Promise.resolve(),
    );
    const unOrphan = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const resolveDuplicateTxOwner = vi.fn<() => Promise<void>>(() =>
      Promise.resolve(),
    );

    const shouldRetry = await handleDuplicateBlockError(
      {
        code: "23505",
        detail: "Key (tx_hash)=(0xabc) already exists.",
      },
      "block 9897",
      deleteIncomingHeight,
      unOrphan,
      resolveDuplicateTxOwner,
    );

    expect(shouldRetry).toBe(true);
    expect(resolveDuplicateTxOwner).toHaveBeenCalledOnce();
    expect(deleteIncomingHeight).not.toHaveBeenCalled();
    expect(unOrphan).not.toHaveBeenCalled();
  });

  it("keeps the existing height-delete retry path for duplicate height errors", async () => {
    const deleteIncomingHeight = vi.fn<() => Promise<void>>(() =>
      Promise.resolve(),
    );
    const resolveDuplicateTxOwner = vi.fn<() => Promise<void>>(() =>
      Promise.resolve(),
    );

    const shouldRetry = await handleDuplicateBlockError(
      {
        code: "23505",
        detail: "Key (height)=(9897) already exists.",
      },
      "block 9897",
      deleteIncomingHeight,
      undefined,
      resolveDuplicateTxOwner,
    );

    expect(shouldRetry).toBe(true);
    expect(deleteIncomingHeight).toHaveBeenCalledOnce();
    expect(resolveDuplicateTxOwner).not.toHaveBeenCalled();
  });
});
