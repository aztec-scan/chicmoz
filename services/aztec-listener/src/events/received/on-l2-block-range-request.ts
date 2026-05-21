import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  generateL2TopicName,
  getConsumerGroupId,
  type L2BlockRangeRequestEvent,
} from "@chicmoz-pkg/message-registry";
import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";
import { INSTANCE_NAME } from "@chicmoz-pkg/microservice-base";
import Bottleneck from "bottleneck";
import {
  L2_BLOCK_RANGE_REQUEST_MAX_AGE_MS,
  L2_BLOCK_RANGE_REQUEST_MAX_BLOCKS,
  L2_BLOCK_RANGE_REQUEST_MAX_RANGES,
  L2_BLOCK_RANGE_REQUEST_MAX_WIDTH,
  L2_BLOCK_RANGE_REQUEST_QUEUE_HIGH_WATER,
  L2_BLOCK_RANGE_REQUEST_QUEUE_MIN_TIME_MS,
  L2_NETWORK_ID,
} from "../../environment.js";
import { onCatchupBlock } from "../emitted/index.js";
import { logger } from "../../logger.js";
import {
  getBlock,
  getLatestProposedHeight,
  getLatestProvenHeight,
} from "../../svcs/poller/network-client/index.js";

const inFlightRequests = new Set<string>();

const requestLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: L2_BLOCK_RANGE_REQUEST_QUEUE_MIN_TIME_MS,
  highWater: L2_BLOCK_RANGE_REQUEST_QUEUE_HIGH_WATER,
  strategy: Bottleneck.strategy.LEAK,
});

const toSafeHeight = (value: unknown) => {
  const height = Number(value);
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new Error(`Invalid L2 block height ${String(value)}`);
  }
  return height;
};

export const getL2BlockRangeRequestDedupKey = (event: L2BlockRangeRequestEvent) =>
  `${L2_NETWORK_ID}:${event.reason}:${event.ranges
    .map((range) => `${range.from}-${range.to}-${range.statusHint ?? "proposed"}`)
    .join(",")}`;

export type ClampedRange = {
  from: number;
  to: number;
  statusHint: "proposed" | "proven";
};

export const clampRangeRequest = ({
  event,
  proposedHeight,
  provenHeight,
}: {
  event: L2BlockRangeRequestEvent;
  proposedHeight: number;
  provenHeight: number;
}) => {
  const clampedRanges: ClampedRange[] = [];
  const invalidRanges: Array<{ from: number; to: number }> = [];
  const cappedRanges = event.ranges.slice(0, L2_BLOCK_RANGE_REQUEST_MAX_RANGES);

  for (const range of cappedRanges) {
    const statusHint = range.statusHint ?? "proposed";
    const from = Math.max(1, Math.floor(range.from));
    const requestedTo = Math.floor(range.to);
    const widthCappedTo = Math.min(requestedTo, from + L2_BLOCK_RANGE_REQUEST_MAX_WIDTH - 1);
    const chainTip = statusHint === "proven" ? provenHeight : proposedHeight;
    const to = Math.min(widthCappedTo, chainTip);
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to < from) {
      invalidRanges.push({ from: range.from, to: range.to });
      continue;
    }
    clampedRanges.push({ from, to, statusHint });
  }

  return {
    clampedRanges,
    invalidRanges,
    skippedRangeCount: Math.max(0, event.ranges.length - cappedRanges.length),
  };
};

const processL2BlockRangeRequest = async (event: L2BlockRangeRequestEvent) => {
  const requestAgeMs = Date.now() - event.requestedAt;
  if (requestAgeMs > L2_BLOCK_RANGE_REQUEST_MAX_AGE_MS) {
    logger.warn(
      `Skipping stale L2 block range request ${event.requestId}; ageMs=${requestAgeMs}`,
    );
    return;
  }
  const proposedHeight = toSafeHeight(await getLatestProposedHeight());
  const provenHeight = toSafeHeight(await getLatestProvenHeight());
  const maxBlocks = Math.min(
    event.maxBlocks ?? L2_BLOCK_RANGE_REQUEST_MAX_BLOCKS,
    L2_BLOCK_RANGE_REQUEST_MAX_BLOCKS,
  );
  let publishedBlocks = 0;
  let failedHeights = 0;
  const startedAt = Date.now();
  const { clampedRanges, invalidRanges, skippedRangeCount } = clampRangeRequest({
    event,
    proposedHeight,
    provenHeight,
  });

  logger.info(
    `Processing L2 block range request ${event.requestId}; reason=${event.reason}; requestedRanges=${event.ranges.length}; clampedRanges=${clampedRanges.length}; skippedRanges=${skippedRangeCount}; invalidRanges=${invalidRanges.length}; maxBlocks=${maxBlocks}`,
  );

  for (const range of clampedRanges) {
    if (publishedBlocks >= maxBlocks) {
      break;
    }

    for (let height = range.from; height <= range.to && publishedBlocks < maxBlocks; height++) {
      const block = await getBlock(height);
      if (!block) {
        failedHeights++;
        logger.warn(`Requested catchup block ${height} not found for ${event.requestId}`);
        continue;
      }
      await onCatchupBlock(
        block,
        range.statusHint === "proven"
          ? ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN
          : ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED,
        {
          requestId: event.requestId,
          catchupReason: event.reason === "tip_boundary_mismatch" ? "reorg_repair" : event.reason,
        },
      );
      publishedBlocks++;
    }
  }

  logger.info(
    `Fulfilled L2 block range request ${event.requestId}; reason=${event.reason}; fulfilledBlocks=${publishedBlocks}; failedHeights=${failedHeights}; invalidRanges=${invalidRanges.length}; latencyMs=${Date.now() - startedAt}`,
  );
};

const onL2BlockRangeRequest = async (event: L2BlockRangeRequestEvent) => {
  const dedupKey = getL2BlockRangeRequestDedupKey(event);
  if (inFlightRequests.has(dedupKey)) {
    logger.info(`Deduped in-flight L2 block range request ${event.requestId}; key=${dedupKey}`);
    return;
  }

  inFlightRequests.add(dedupKey);
  try {
    await requestLimiter.schedule(() => processL2BlockRangeRequest(event));
  } catch (error) {
    if (error instanceof Bottleneck.BottleneckError) {
      logger.warn(`Skipped queued L2 block range request ${event.requestId}: ${error.message}`);
    } else {
      throw error;
    }
  } finally {
    inFlightRequests.delete(dedupKey);
  }
};

export const l2BlockRangeRequestHandler: EventHandler = {
  groupId: getConsumerGroupId({
    serviceName: INSTANCE_NAME,
    networkId: L2_NETWORK_ID,
    handlerName: "blockRangeRequestHandler",
  }),
  topic: generateL2TopicName(L2_NETWORK_ID, "L2_BLOCK_RANGE_REQUEST_EVENT"),
  cb: onL2BlockRangeRequest as (arg0: unknown) => Promise<void>,
};
