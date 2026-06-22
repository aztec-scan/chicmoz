import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = {
    insertValues: [] as unknown[],
    selectRows: [] as unknown[][],
    chainInfo: null as
      | {
          l1ContractAddresses: { feeJuicePortalAddress: string };
        }
      | null,
  };

  const onConflictDoNothing = vi.fn(() => Promise.resolve());
  const values = vi.fn((v: unknown) => {
    state.insertValues.push(v);
    return { onConflictDoNothing };
  });
  const insert = vi.fn(() => ({ values }));

  const limit = vi.fn(() => Promise.resolve(state.selectRows.shift() ?? []));
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where, orderBy }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { insert, select },
    state,
    insert,
    values,
    onConflictDoNothing,
    select,
    from,
    where,
    orderBy,
    limit,
  };
});

vi.mock("@chicmoz-pkg/postgres-helper", () => ({
  getDb: () => mocks.db,
}));

vi.mock("../../src/environment.js", () => ({
  L2_NETWORK_ID: "testnet",
}));

vi.mock("../../src/logger.js", () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("../../src/svcs/database/controllers/l2/index.js", () => ({
  getL2ChainInfo: vi.fn(() => Promise.resolve(mocks.state.chainInfo)),
}));

const { store } = await import(
  "../../src/svcs/database/controllers/l1/fee-juice-portal-deposit/store.js"
);
const { getByL2Address } = await import(
  "../../src/svcs/database/controllers/l1/fee-juice-portal-deposit/get.js"
);

const baseDeposit = {
  l1ContractAddress: "0xFeeJuicePortal00000000000000000000000001",
  l1BlockNumber: BigInt(10_000_000),
  l1BlockHash: "0xblockhash000000000000000000000000000000000000000000000000000001",
  l1BlockTimestamp: 1_748_476_800,
  l1TransactionHash:
    "0xtxhash0000000000000000000000000000000000000000000000000000000001",
  l1LogIndex: 0,
  isFinalized: false,
  to: "0xrecipient00000000000000000000000000000000000000000000000000001",
  amount: BigInt("1000000000000000000"),
  secretHash:
    "0xsecret0000000000000000000000000000000000000000000000000000000001",
  key: "0xkey00000000000000000000000000000000000000000000000000000000001",
  index: BigInt(7),
};

beforeEach(() => {
  mocks.state.insertValues = [];
  mocks.state.selectRows = [];
  mocks.state.chainInfo = null;
  vi.clearAllMocks();
});

describe("fee-juice-portal-deposit store", () => {
  it("inserts a deposit with onConflictDoNothing", async () => {
    await store(baseDeposit);

    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.values).toHaveBeenCalledOnce();
    expect(mocks.onConflictDoNothing).toHaveBeenCalledOnce();
    expect(mocks.state.insertValues[0]).toMatchObject({
      to: baseDeposit.to,
      amount: baseDeposit.amount.toString(),
      index: baseDeposit.index.toString(),
      isFinalized: false,
    });
  });
});

describe("fee-juice-portal-deposit getByL2Address", () => {
  it("returns an empty array when no rows match", async () => {
    mocks.state.selectRows = [[]];
    const result = await getByL2Address(baseDeposit.to);
    expect(result).toEqual([]);
  });

  it("parses and returns rows for the given address", async () => {
    const row = {
      id: "00000000-0000-0000-0000-000000000001",
      ...baseDeposit,
    };
    mocks.state.selectRows = [[row]];
    const result = await getByL2Address(baseDeposit.to);
    expect(result).toHaveLength(1);
    expect(result[0].to).toBe(baseDeposit.to);
    expect(result[0].amount).toBe(baseDeposit.amount);
    expect(result[0].index).toBe(baseDeposit.index);
  });

  it("filters by current fee juice portal when chain info is available", async () => {
    mocks.state.chainInfo = {
      l1ContractAddresses: {
        feeJuicePortalAddress: baseDeposit.l1ContractAddress,
      },
    };
    mocks.state.selectRows = [[]];

    await getByL2Address(baseDeposit.to);

    expect(mocks.where).toHaveBeenCalledOnce();
  });
});
