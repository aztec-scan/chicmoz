import { RollupAbi } from "@aztec/l1-artifacts";
import {
  type ChicmozL1L2Validator,
  chicmozL1L2ValidatorSchema,
} from "@chicmoz-pkg/types";
import { emit } from "../../events/index.js";
import { logger } from "../../logger.js";
import { type AztecContracts } from "../contracts/utils.js";
import { getPublicHttpBackupClient, getPublicHttpClient } from "./index.js";
import {
  ATTESTER_BATCH_DELAY_MS,
  BATCH_SIZE,
  ATTESTER_CIRCUIT_BREAKER_THRESHOLD,
  ATTESTER_CIRCUIT_BREAKER_TIMEOUT_MS,
  ATTESTER_INITIAL_BACKOFF_MS,
  ATTESTER_MAX_RETRIES,
} from "../../environment.js";

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
};

let latestPublishedHeight = 0n;
let consecutiveFailures = 0;
let circuitBreakerOpenUntil = 0;
const indexOffsetCache = new Map<`0x${string}`, number>();

const isOutOfBoundsError = (error: unknown): boolean =>
  String(error).includes("GSE__OutOfBounds");

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

  const indexOffset = await determineIndexOffset(
    contracts.rollup.address,
    latestHeight,
    attesterCount,
  );
  const attesters = await fetchAllAttesters(
    contracts.rollup.address,
    attesterCount,
    indexOffset,
    latestHeight,
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
  blockNumber: bigint,
  attesterCount: number,
): Promise<number> => {
  const cached = indexOffsetCache.get(rollupAddress);
  if (cached !== undefined) {
    return cached;
  }

  // Try 0-based indexing with public client first
  try {
    await getPublicHttpClient().readContract({
      address: rollupAddress,
      abi: RollupAbi,
      functionName: "getAttesterAtIndex",
      blockNumber,
      args: [0n],
    });
    logger.info("Using 0-based indexing");
    indexOffsetCache.set(rollupAddress, 0);
    return 0;
  } catch (error) {
    const backup = getPublicHttpBackupClient();
    if (backup) {
      try {
        await backup.readContract({
          address: rollupAddress,
          abi: RollupAbi,
          functionName: "getAttesterAtIndex",
          blockNumber,
          args: [0n],
        });
        logger.info("Using 0-based indexing");
        indexOffsetCache.set(rollupAddress, 0);
        return 0;
      } catch (backupError) {
        throw new Error(
          `Unable to read attester index 0 for ${rollupAddress} with backup client: ${String(backupError)}`,
        );
      }
    }
    throw new Error(
      `Unable to read attester index 0 for ${rollupAddress} with ${attesterCount} attesters at block ${blockNumber}: ${String(error)}`,
    );
  }
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
  blockNumber: bigint,
): Promise<ChicmozL1L2Validator[]> => {
  if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE <= 0) {
    throw new Error(`ATTESTER_BATCH_SIZE must be positive, got ${BATCH_SIZE}`);
  }

  const attesters: ChicmozL1L2Validator[] = [];
  const estimatedTotalBatches = Math.ceil(totalCount / BATCH_SIZE);
  const startTime = Date.now();

  logger.info(
    `🔍 Starting: ${totalCount} attesters in ${estimatedTotalBatches} batches (${ATTESTER_BATCH_DELAY_MS}ms delays)`,
  );
  for (let counter = 0; counter < totalCount; counter += BATCH_SIZE) {
    await sleep(ATTESTER_BATCH_DELAY_MS);
    const batchNumber = Math.floor(counter / BATCH_SIZE) + 1;

    const [batchAttesters, outOfBoundsDetails] = await processBatchWithRetry(
      rollupAddress,
      counter,
      indexOffset,
      blockNumber,
      totalCount,
    );
    attesters.push(...batchAttesters);

    if (outOfBoundsDetails) {
      throw new Error(
        `Unexpected out-of-bounds access at index ${outOfBoundsDetails.attemptedIndex} while fetching ${totalCount} attesters`,
      );
    }

    // Log progress every 100 batches or on completion
    if (batchNumber % 100 === 0 || counter + BATCH_SIZE >= totalCount) {
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
  blockNumber: bigint,
  totalCount: number,
): Promise<[ChicmozL1L2Validator[], OutOfBoundsDetails | null]> => {
  if (isCircuitBreakerOpen()) {
    throw new Error(
      `Circuit breaker is open, cannot safely publish attester snapshot for batch ${batchStart}`,
    );
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= ATTESTER_MAX_RETRIES; attempt++) {
    try {
      const result = await processBatch(
        rollupAddress,
        batchStart,
        indexOffset,
        blockNumber,
        totalCount,
      );
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

  throw new Error(
    `All ${ATTESTER_MAX_RETRIES} attempts failed for batch ${batchStart}: ${String(lastError)}`,
  );
};

const processBatch = async (
  rollupAddress: `0x${string}`,
  batchStart: number,
  indexOffset: number,
  blockNumber: bigint,
  totalCount: number,
): Promise<[ChicmozL1L2Validator[], OutOfBoundsDetails | null]> => {
  const batchEnd = Math.min(batchStart + BATCH_SIZE, totalCount);

  const [addresses, outOfBoundsDetails] = await fetchAttesterAddresses(
    rollupAddress,
    batchStart,
    batchEnd,
    indexOffset,
    blockNumber,
  );
  const views = await fetchAttesterViews(rollupAddress, addresses, blockNumber);

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
  blockNumber: bigint,
): Promise<[`0x${string}`[], OutOfBoundsDetails | null]> => {
  const results: (`0x${string}` | null)[] = [];
  const outOfBoundsDetails: OutOfBoundsDetails | null = null;

  for (let i = start; i < end; i++) {
    const contractIndex = i + indexOffset;
    try {
      const addr = await getPublicHttpClient().readContract({
        address: rollupAddress,
        abi: RollupAbi,
        functionName: "getAttesterAtIndex",
        blockNumber,
        args: [BigInt(contractIndex)],
      });
      results.push(addr);
    } catch (error) {
      const errorString = String(error);
      logger.warn(
        `Failed to get attester at index ${contractIndex} with public client: ${errorString}`,
      );
      if (isOutOfBoundsError(error)) {
        throw new Error(
          `Unexpected out-of-bounds at attester index ${contractIndex}`,
        );
      }
      const backup = getPublicHttpBackupClient();
      if (backup) {
        try {
          const addr = await backup.readContract({
            address: rollupAddress,
            abi: RollupAbi,
            functionName: "getAttesterAtIndex",
            blockNumber,
            args: [BigInt(contractIndex)],
          });
          results.push(addr);
        } catch (backupError) {
          const backupErrorString = String(backupError);
          if (isOutOfBoundsError(backupError)) {
            const match = backupErrorString.match(
              /GSE__OutOfBounds\((\d+),\s*(\d+)\)/,
            );
            if (match) {
              const attemptedIndex = parseInt(match[1], 10);
              throw new Error(
                `Unexpected out-of-bounds at attester index ${attemptedIndex}: ${backupErrorString}`,
              );
            }
          }
          throw new Error(
            `Failed to get attester at index ${contractIndex} with backup client: ${backupErrorString}`,
          );
        }
      } else {
        throw new Error(
          `Failed to get attester at index ${contractIndex}: ${errorString}`,
        );
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
  blockNumber: bigint,
): Promise<AttesterView[]> => {
  const promises = addresses.map((address) =>
    getPublicHttpClient().readContract({
      address: rollupAddress,
      abi: RollupAbi,
      functionName: "getAttesterView",
      blockNumber,
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
