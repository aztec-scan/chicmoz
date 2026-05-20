import { L2Block } from "@aztec/aztec.js/block";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { logger } from "../../../../logger.js";
import { txsController } from "../../../database/index.js";
import { publishMessage } from "../../../message-bus/index.js";
import { getBalanceOf } from "../../network-client/index.js";

type StoredTx = Awaited<ReturnType<typeof txsController.getTxs>>[number];
type BalanceFetchSuccess = {
  status: "fulfilled";
  addr: string;
  sourceTxHash: string;
  balance: Awaited<ReturnType<typeof getBalanceOf>>;
};
type BalanceFetchFailure = {
  status: "rejected";
  addr: string;
  sourceTxHash: string;
  reason: unknown;
};

const BALANCE_FETCH_CONCURRENCY = 8;

// Collect all unique addresses across all proven txs in the block.
// Maps address → first txHash that introduced it (used as sourceTxHash).
const collectUniqueAddresses = (provenTxs: StoredTx[]): Map<string, string> => {
  const addressToTxHash = new Map<string, string>();

  for (const tx of provenTxs) {
    const candidates: (string | null | undefined)[] = [
      tx.feePayer,
      tx.initiator,
      ...(tx.additionalMsgSenders ? tx.additionalMsgSenders.split(",") : []),
    ];

    for (const addr of candidates) {
      if (addr && !addressToTxHash.has(addr)) {
        addressToTxHash.set(addr, tx.txHash);
      }
    }
  }

  return addressToTxHash;
};

const fetchBalances = async (
  blockNumber: bigint,
  addressToTxHash: Map<string, string>,
) => {
  const entries = [...addressToTxHash.entries()];
  const results: Array<BalanceFetchSuccess | BalanceFetchFailure> = [];
  let nextIndex = 0;

  await Promise.all(
    Array.from(
      { length: Math.min(BALANCE_FETCH_CONCURRENCY, entries.length) },
      async () => {
        while (nextIndex < entries.length) {
          const currentIndex = nextIndex++;
          const [addr, sourceTxHash] = entries[currentIndex];

          try {
            const balance = await getBalanceOf(
              blockNumber,
              AztecAddress.fromString(addr),
            );
            results[currentIndex] = {
              status: "fulfilled",
              addr,
              sourceTxHash,
              balance,
            };
          } catch (reason) {
            results[currentIndex] = {
              status: "rejected",
              addr,
              sourceTxHash,
              reason,
            };
          }
        }
      },
    ),
  );

  return results;
};

export const handleProvenTransactions = async (block: L2Block) => {
  try {
    const notProvenTxs = await txsController.getTxs([
      "pending",
      "dropped",
      "proposed",
    ]);
    if (notProvenTxs.length === 0) {
      return;
    }

    const provenTxHashes = block.body.txEffects.map((txEffect) => {
      const hash = txEffect.txHash;
      return hash.toString();
    });

    const provenPendingTxs = provenTxHashes
      .map((txHash) => {
        const tx = notProvenTxs.find((tx) => tx.txHash === txHash);
        if (!tx) {
          return undefined;
        }
        logger.info(`🔍 ${txHash} found in pending or dropped txs`);
        return tx;
      })
      .filter((tx) => tx !== undefined);

    if (provenPendingTxs.length === 0) {
      return;
    }

    const blockNumber = BigInt(
      block.header.globalVariables.blockNumber.toString(),
    );
    logger.info(
      `🎯 Found ${provenPendingTxs.length} proven pending txs in block ${blockNumber}`,
    );

    // Step 1 — collect all unique addresses across the entire block
    const addressToTxHash = collectUniqueAddresses(provenPendingTxs);
    logger.info(
      `📋 Fetching fee-juice balances for ${addressToTxHash.size} unique addresses in block ${blockNumber}`,
    );

    // Step 2 — fetch balances with bounded concurrency
    const balanceResults = await fetchBalances(blockNumber, addressToTxHash);

    // Step 3 — publish Kafka events for successful balance fetches
    await Promise.all(
      balanceResults.map(async (result) => {
        if (result.status === "rejected") {
          logger.error(
            `Failed to fetch balance for ${result.addr} (sourceTxHash: ${result.sourceTxHash}, block: ${blockNumber.toString()}): ${String(result.reason)}`,
          );
          return;
        }
        const { addr, sourceTxHash, balance } = result;
        await publishMessage("CONTRACT_INSTANCE_BALANCE_EVENT", {
          contractAddress: addr,
          balance: balance.toBigInt().toString(),
          timestamp: new Date().getTime(),
          sourceTxHash,
        });
        logger.info(`💰 Snapshotted balance for ${addr}`);
      }),
    );

    // Step 4 — update tx states in parallel
    await Promise.all(
      provenPendingTxs.map(async (provenTx) => {
        try {
          await txsController.storeOrUpdateState(provenTx.txHash, "proven");
          logger.info(`✅ Updated tx ${provenTx.txHash} to proven state`);
        } catch (error) {
          logger.error(`Error updating tx ${provenTx.txHash} state:`, error);
        }
      }),
    );
  } catch (error) {
    logger.error("Error handling proven transactions:", error);
  }
};
