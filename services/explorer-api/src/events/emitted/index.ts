import {
  L2BlockRangeRequestEvent,
  type L1GovernanceUriRequestEvent,
} from "@chicmoz-pkg/message-registry";
import {
  publishL1Message,
  publishMessage,
} from "../../svcs/message-bus/index.js";

export const l2BlockRangeRequest = async (
  request: L2BlockRangeRequestEvent | null,
) => {
  if (request) {
    await publishMessage("L2_BLOCK_RANGE_REQUEST_EVENT", request);
  }
};

export const l1GovernanceUriRequest = async (
  request: L1GovernanceUriRequestEvent | null,
) => {
  if (request) {
    await publishL1Message("L1_GOVERNANCE_URI_REQUEST_EVENT", request);
  }
};
