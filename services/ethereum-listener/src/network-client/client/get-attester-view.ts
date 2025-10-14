import { RollupAbi } from "@aztec/l1-artifacts";
import {
  ChicmozL1L2Validator,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { emit } from "../../events/index.js";
import { logger } from "../../logger.js";
import { AztecContracts } from "../contracts/utils.js";
import { getPublicHttpBackupClient, getPublicHttpClient } from "./index.js";
import {
  ATTESTER_BATCH_DELAY_MS,
  BATCH_SIZE,
  ATTESTER_CIRCUIT_BREAKER_THRESHOLD,
  ATTESTER_CIRCUIT_BREAKER_TIMEOUT_MS,
  ATTESTER_INITIAL_BACKOFF_MS,
  ATTESTER_MAX_RETRIES,
} from "../../environment.js";
export { startContractWatchers as watchContractsEvents } from "../contracts/index.js";

type AttesterView = {
  status: number;
  effectiveBalance: bigint;
  exit: {
    withdrawalId: bigint;
    amount: bigint;
    exitableAt: bigint;
    recipientOrWithdrawer: `0x${string}`;
    isRecipient: boolean;
    exists: boolean;
  };
  config: {
    publicKey: {
      x: bigint;
      y: bigint;
    };
    withdrawer: `0x${string}`;
  };
};

type OutOfBoundsDetails = {
  attemptedIndex: number;
  newTotalCount: number;
};

let latestPublishedHeight = 0n;
let consecutiveFailures = 0;
let circuitBreakerOpenUntil = 0;

export const queryStakingStateAndEmitUpdates = async ({
  contracts,
  latestHeight,
}: {
  contracts: AztecContracts;
  latestHeight: bigint;
}): Promise<void> => {
  if (latestHeight <= latestPublishedHeight) {
    logger.info(`Skipping - height ${latestHeight} already processed`);
    return;
  }

  const attesterCount = await getAttesterCount(
    contracts.rollup.address,
    latestHeight,
  );
  logger.info(`Found ${attesterCount} active attesters`);

  if (attesterCount === 0) {
    await emit.l1Validator([]);
    latestPublishedHeight = latestHeight;
    return;
  }

  const indexOffset = await determineIndexOffset(contracts.rollup.address);
  const attesters = await fetchAllAttesters(
    contracts.rollup.address,
    attesterCount,
    indexOffset,
  );

  await emit.l1Validator(attesters);
  latestPublishedHeight = latestHeight;
};

const getAttesterCount = async (
  rollupAddress: `0x${string}`,
  blockNumber: bigint,
): Promise<number> => {
  const count = await getPublicHttpClient().readContract({
    address: rollupAddress,
    abi: RollupAbi,
    blockNumber,
    functionName: "getActiveAttesterCount",
  });
  return Number(count);
};

const determineIndexOffset = async (
  rollupAddress: `0x${string}`,
): Promise<number> => {
  // Try 0-based indexing with public client first
  try {
    await getPublicHttpClient().readContract({
      address: rollupAddress,
      abi: RollupAbi,
      functionName: "getAttesterAtIndex",
      args: [0n],
    });
    logger.info("Using 0-based indexing");
    return 0;
  } catch {
    const backup = getPublicHttpBackupClient();
    if (backup) {
      try {
        await backup.readContract({
          address: rollupAddress,
          abi: RollupAbi,
          functionName: "getAttesterAtIndex",
          args: [0n],
        });
        logger.info("Using 0-based indexing");
        return 0;
      } catch {
        logger.warn("Unable to determine indexing - trying 1-based next");
      }
    }
  }

  // Try 1-based indexing with public client first
  try {
    await getPublicHttpClient().readContract({
      address: rollupAddress,
      abi: RollupAbi,
      functionName: "getAttesterAtIndex",
      args: [1n],
    });
    logger.info("Using 1-based indexing");
    return 1;
  } catch {
    const backup = getPublicHttpBackupClient();
    if (backup) {
      try {
        await backup.readContract({
          address: rollupAddress,
          abi: RollupAbi,
          functionName: "getAttesterAtIndex",
          args: [1n],
        });
        logger.info("Using 1-based indexing");
        return 1;
      } catch {
        logger.warn("Unable to determine indexing - assuming 0-based");
      }
    }
  }
  return 0;
};

const getETA = (estimatedTotal: number, elapsedTime: number): string => {
  const estimatedRemainingSeconds = Math.max(0, estimatedTotal - elapsedTime);
  if (estimatedRemainingSeconds > 60) {
    return `~${Math.round(estimatedRemainingSeconds / 60)}m`;
  } else {
    return `~${Math.round(estimatedRemainingSeconds)}s`;
  }
};

const fetchAllAttesters = async (
  rollupAddress: `0x${string}`,
  totalCount: number,
  indexOffset: number,
): Promise<ChicmozL1L2Validator[]> => {
  const attesters: ChicmozL1L2Validator[] = [];
  const estimatedTotalBatches = Math.ceil(totalCount / BATCH_SIZE);
  const startTime = Date.now();

  logger.info(
    `🔍 Starting: ${totalCount} attesters in ${estimatedTotalBatches} batches (${ATTESTER_BATCH_DELAY_MS}ms delays)`,
  );
  let counter = 0;
  let isFinished = false;
  while (!isFinished) {
    await sleep(ATTESTER_BATCH_DELAY_MS);
    const batchNumber = Math.floor(counter / BATCH_SIZE) + 1;

    const [batchAttesters, outOfBoundsDetails] = await processBatchWithRetry(
      rollupAddress,
      counter,
      indexOffset,
    );
    attesters.push(...batchAttesters);

    if (outOfBoundsDetails) {
      const lessOrMore =
        outOfBoundsDetails.newTotalCount < totalCount ? "less" : "more";
      logger.warn(
        `Finished due to out-of-bounds access at index ${outOfBoundsDetails.attemptedIndex}` +
        `(new totalCount: ${outOfBoundsDetails.newTotalCount},` +
        `${Math.abs(outOfBoundsDetails.newTotalCount - totalCount)} ${lessOrMore} than previous ${totalCount})`,
      );
      isFinished = true;
    }

    // Log progress every 100 batches or on completion
    if (batchNumber % 100 === 0 || isFinished) {
      const totalProgress = (
        (batchNumber / estimatedTotalBatches) *
        100
      ).toFixed(1);
      const elapsedTime = (Date.now() - startTime) / 1000;
      const estimatedTotal =
        (elapsedTime * estimatedTotalBatches) / batchNumber;

      logger.info(
        `🔍 Batch ${batchNumber}/${estimatedTotalBatches} (${totalProgress}%) | ` +
        `Attesters: ${attesters.length}/${totalCount} | ` +
        `ETA: ${getETA(estimatedTotal, elapsedTime)}`,
      );
    }
    counter += BATCH_SIZE;
  }

  const totalDuration = (Date.now() - startTime) / 1000;
  logger.info(
    `🔍 Completed: ${attesters.length}/${totalCount} attesters in ${Math.round(totalDuration)}s`,
  );

  return attesters;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isCircuitBreakerOpen = (): boolean => {
  return Date.now() < circuitBreakerOpenUntil;
};

const openCircuitBreaker = (): void => {
  circuitBreakerOpenUntil = Date.now() + ATTESTER_CIRCUIT_BREAKER_TIMEOUT_MS;
  logger.warn(
    `Circuit breaker opened for ${ATTESTER_CIRCUIT_BREAKER_TIMEOUT_MS}ms after ${consecutiveFailures} consecutive failures`,
  );
};

const resetCircuitBreaker = (): void => {
  consecutiveFailures = 0;
  circuitBreakerOpenUntil = 0;
};

const processBatchWithRetry = async (
  rollupAddress: `0x${string}`,
  batchStart: number,
  indexOffset: number,
): Promise<[ChicmozL1L2Validator[], OutOfBoundsDetails | null]> => {
  if (isCircuitBreakerOpen()) {
    logger.warn(`Circuit breaker is open, skipping batch ${batchStart}`);
    return [[], null];
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= ATTESTER_MAX_RETRIES; attempt++) {
    try {
      const result = await processBatch(rollupAddress, batchStart, indexOffset);
      resetCircuitBreaker();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === ATTESTER_MAX_RETRIES) {
        break;
      }

      const backoffDelay =
        ATTESTER_INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.warn(
        `Batch attempt ${attempt}/${ATTESTER_MAX_RETRIES} failed, retrying in ${backoffDelay}ms: ${String(error)}`,
      );
      await sleep(backoffDelay);
    }
  }

  consecutiveFailures++;
  if (consecutiveFailures >= ATTESTER_CIRCUIT_BREAKER_THRESHOLD) {
    openCircuitBreaker();
  }

  logger.error(
    `All ${ATTESTER_MAX_RETRIES} attempts failed for batch ${batchStart}: ${String(lastError)}`,
  );
  return [[], null];
};

const processBatch = async (
  rollupAddress: `0x${string}`,
  batchStart: number,
  indexOffset: number,
): Promise<[ChicmozL1L2Validator[], OutOfBoundsDetails | null]> => {
  const batchEnd = batchStart + BATCH_SIZE;

  const [addresses, outOfBoundsDetails] = await fetchAttesterAddresses(
    rollupAddress,
    batchStart,
    batchEnd,
    indexOffset,
  );
  const views = await fetchAttesterViews(rollupAddress, addresses);

  return [
    createValidatorObjects(rollupAddress, addresses, views),
    outOfBoundsDetails,
  ];
};

const fetchAttesterAddresses = async (
  rollupAddress: `0x${string}`,
  start: number,
  end: number,
  indexOffset: number,
): Promise<[`0x${string}`[], OutOfBoundsDetails | null]> => {
  const results: (`0x${string}` | null)[] = [];
  let outOfBoundsDetails: OutOfBoundsDetails | null = null;

  for (let i = start; i < end; i++) {
    const contractIndex = i + indexOffset;
    try {
      const addr = await getPublicHttpClient().readContract({
        address: rollupAddress,
        abi: RollupAbi,
        functionName: "getAttesterAtIndex",
        args: [BigInt(contractIndex)],
      });
      results.push(addr);
    } catch (error) {
      const errorString = String(error);
      if (errorString.includes("GSE__OutOfBounds")) {
        // Extract the indices from the error message
        const match = errorString.match(/GSE__OutOfBounds\((\d+),\s*(\d+)\)/);
        if (match) {
          const attemptedIndex = parseInt(match[1], 10);
          const maxIndex = parseInt(match[2], 10);
          outOfBoundsDetails = {
            attemptedIndex,
            newTotalCount: maxIndex + 1, // maxIndex is the last valid index, so total count is maxIndex + 1
          };
          logger.warn(
            `Out of bounds detected at index ${contractIndex}: ${errorString}`,
          );
          break; // Stop fetching more addresses
        }
      }
      logger.warn(
        `Failed to get attester at index ${contractIndex} with public client: ${errorString}`,
      );
      const backup = getPublicHttpBackupClient();
      if (backup) {
        try {
          const addr = await backup.readContract({
            address: rollupAddress,
            abi: RollupAbi,
            functionName: "getAttesterAtIndex",
            args: [BigInt(contractIndex)],
          });
          results.push(addr);
        } catch (backupError) {
          const backupErrorString = String(backupError);
          if (backupErrorString.includes("GSE__OutOfBounds")) {
            const match = backupErrorString.match(
              /GSE__OutOfBounds\((\d+),\s*(\d+)\)/,
            );
            if (match) {
              const attemptedIndex = parseInt(match[1], 10);
              const maxIndex = parseInt(match[2], 10);
              outOfBoundsDetails = {
                attemptedIndex,
                newTotalCount: maxIndex + 1,
              };
              logger.warn(
                `Out of bounds detected at index ${contractIndex} with backup client: ${backupErrorString}`,
              );
              break;
            }
          }
          logger.warn(
            `Failed to get attester at index ${contractIndex} with backup client: ${backupErrorString}`,
          );
          results.push(null);
        }
      } else {
        results.push(null);
      }
    }
  }

  const addresses = results.filter(
    (addr): addr is `0x${string}` => addr !== null,
  );
  return [addresses, outOfBoundsDetails];
};

const fetchAttesterViews = async (
  rollupAddress: `0x${string}`,
  addresses: `0x${string}`[],
): Promise<AttesterView[]> => {
  const promises = addresses.map((address) =>
    getPublicHttpClient().readContract({
      address: rollupAddress,
      abi: RollupAbi,
      functionName: "getAttesterView",
      args: [address],
    }),
  );

  return Promise.all(promises) as Promise<AttesterView[]>;
};

const createValidatorObjects = (
  rollupAddress: `0x${string}`,
  addresses: `0x${string}`[],
  views: AttesterView[],
): ChicmozL1L2Validator[] => {
  const validators: ChicmozL1L2Validator[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const view = views[i];

    if (!view) {
      logger.warn(`No view data for attester ${address}`);
      continue;
    }

    validators.push(
      chicmozL1L2ValidatorSchema.parse({
        rollupAddress,
        attester: address,
        stake: view.effectiveBalance,
        withdrawer: view.config.withdrawer,
        proposer: view.config.withdrawer,
        status: view.status,
      }),
    );
  }

  return validators;
};
