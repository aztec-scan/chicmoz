import { L2BlockRangeRequestEvent } from "@chicmoz-pkg/message-registry";
import { publishMessage } from "../../svcs/message-bus/index.js";

export const l2BlockRangeRequest = async (
  request: L2BlockRangeRequestEvent | null,
) => {
  if (request) {
    await publishMessage("L2_BLOCK_RANGE_REQUEST_EVENT", request);
  }
};
