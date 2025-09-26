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
  BATCH_DELAY_MS,
  BATCH_SIZE,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT_MS,
  INITIAL_BACKOFF_MS,
  MAX_RETRIES,
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
  const client = getPublicHttpBackupClient() ?? getPublicHttpClient();

  try {
    await client.readContract({
      address: rollupAddress,
      abi: RollupAbi,
      functionName: "getAttesterAtIndex",
      args: [0n],
    });
    logger.info("Using 0-based indexing");
    return 0;
  } catch {
    try {
      await client.readContract({
        address: rollupAddress,
        abi: RollupAbi,
        functionName: "getAttesterAtIndex",
        args: [1n],
      });
      logger.info("Using 1-based indexing");
      return 1;
    } catch {
      logger.warn("Unable to determine indexing - assuming 0-based");
      return 0;
    }
  }
};

const fetchAllAttesters = async (
  rollupAddress: `0x${string}`,
  totalCount: number,
  indexOffset: number,
): Promise<ChicmozL1L2Validator[]> => {
  const attesters: ChicmozL1L2Validator[] = [];
  const totalBatches = Math.ceil(totalCount / BATCH_SIZE);

  logger.info(
    `Processing ${totalCount} attesters in ${totalBatches} batches with ${BATCH_DELAY_MS}ms delays`,
  );

  for (let batchStart = 0; batchStart < totalCount; batchStart += BATCH_SIZE) {
    const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
    logger.info(`Processing batch ${batchNumber}/${totalBatches}`);

    const batchAttesters = await processBatchWithRetry(
      rollupAddress,
      batchStart,
      totalCount,
      indexOffset,
    );
    attesters.push(...batchAttesters);

    // Add delay between batches (except for the last batch)
    if (batchStart + BATCH_SIZE < totalCount) {
      logger.info(`Waiting ${BATCH_DELAY_MS}ms before next batch`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  return attesters;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isCircuitBreakerOpen = (): boolean => {
  return Date.now() < circuitBreakerOpenUntil;
};

const openCircuitBreaker = (): void => {
  circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT_MS;
  logger.warn(
    `Circuit breaker opened for ${CIRCUIT_BREAKER_TIMEOUT_MS}ms after ${consecutiveFailures} consecutive failures`,
  );
};

const resetCircuitBreaker = (): void => {
  consecutiveFailures = 0;
  circuitBreakerOpenUntil = 0;
};

const processBatchWithRetry = async (
  rollupAddress: `0x${string}`,
  batchStart: number,
  totalCount: number,
  indexOffset: number,
): Promise<ChicmozL1L2Validator[]> => {
  if (isCircuitBreakerOpen()) {
    logger.warn(`Circuit breaker is open, skipping batch ${batchStart}`);
    return [];
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await processBatch(
        rollupAddress,
        batchStart,
        totalCount,
        indexOffset,
      );
      resetCircuitBreaker();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) {
        break;
      }

      const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.warn(
        `Batch attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${backoffDelay}ms: ${String(error)}`,
      );
      await sleep(backoffDelay);
    }
  }

  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    openCircuitBreaker();
  }

  logger.error(
    `All ${MAX_RETRIES} attempts failed for batch ${batchStart}: ${String(lastError)}`,
  );
  return [];
};

const processBatch = async (
  rollupAddress: `0x${string}`,
  batchStart: number,
  totalCount: number,
  indexOffset: number,
): Promise<ChicmozL1L2Validator[]> => {
  const batchEnd = Math.min(batchStart + BATCH_SIZE, totalCount);

  const addresses = await fetchAttesterAddresses(
    rollupAddress,
    batchStart,
    batchEnd,
    indexOffset,
  );
  const views = await fetchAttesterViews(rollupAddress, addresses);

  return createValidatorObjects(rollupAddress, addresses, views);
};

const fetchAttesterAddresses = async (
  rollupAddress: `0x${string}`,
  start: number,
  end: number,
  indexOffset: number,
): Promise<`0x${string}`[]> => {
  const client = getPublicHttpBackupClient() ?? getPublicHttpClient();
  const promises = [];

  for (let i = start; i < end; i++) {
    const contractIndex = i + indexOffset;
    promises.push(
      client
        .readContract({
          address: rollupAddress,
          abi: RollupAbi,
          functionName: "getAttesterAtIndex",
          args: [BigInt(contractIndex)],
        })
        .catch((error: unknown) => {
          logger.warn(
            `Failed to get attester at index ${contractIndex}: ${String(error)}`,
          );
          return null;
        }),
    );
  }

  const results = await Promise.all(promises);
  return results.filter((addr): addr is `0x${string}` => addr !== null);
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
