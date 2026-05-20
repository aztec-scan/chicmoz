import { EventHandler } from "@chicmoz-pkg/message-bus";
import {
  generateL2TopicName,
  getConsumerGroupId,
  L2BlockRangeRequestEvent,
} from "@chicmoz-pkg/message-registry";
import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";
import { INSTANCE_NAME } from "@chicmoz-pkg/microservice-base";
import { L2_NETWORK_ID } from "../../environment.js";
import { onCatchupBlock } from "../emitted/index.js";
import { logger } from "../../logger.js";
import {
  getBlock,
  getLatestProposedHeight,
  getLatestProvenHeight,
} from "../../svcs/poller/network-client/index.js";

const DEFAULT_MAX_BLOCKS = 500;
const MAX_REQUEST_AGE_MS = 60 * 60 * 1000;

const toSafeHeight = (value: unknown) => {
  const height = Number(value);
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new Error(`Invalid L2 block height ${String(value)}`);
  }
  return height;
};

const onL2BlockRangeRequest = async (event: L2BlockRangeRequestEvent) => {
  if (Date.now() - event.requestedAt > MAX_REQUEST_AGE_MS) {
    logger.warn(`Skipping stale L2 block range request ${event.requestId}`);
    return;
  }
  const proposedHeight = toSafeHeight(await getLatestProposedHeight());
  const provenHeight = toSafeHeight(await getLatestProvenHeight());
  const maxBlocks = Math.min(event.maxBlocks ?? DEFAULT_MAX_BLOCKS, DEFAULT_MAX_BLOCKS);
  let publishedBlocks = 0;

  logger.info(
    `Received L2 block range request ${event.requestId} (${event.reason}) with ${event.ranges.length} ranges`,
  );

  for (const range of event.ranges) {
    if (publishedBlocks >= maxBlocks) {
      break;
    }
    const from = Math.max(1, Math.floor(range.from));
    const chainTip = range.statusHint === "proven" ? provenHeight : proposedHeight;
    const to = Math.min(Math.floor(range.to), chainTip);
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to < from) {
      logger.warn(
        `Skipping invalid L2 block range request ${event.requestId}: ${range.from}-${range.to}`,
      );
      continue;
    }

    for (let height = from; height <= to && publishedBlocks < maxBlocks; height++) {
      const block = await getBlock(height);
      if (!block) {
        logger.warn(`Requested catchup block ${height} not found`);
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

  logger.info(`Fulfilled L2 block range request ${event.requestId} with ${publishedBlocks} blocks`);
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
