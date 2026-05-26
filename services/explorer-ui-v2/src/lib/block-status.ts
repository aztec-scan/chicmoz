import { type ChicmozL2NativeBlockStatus } from "@chicmoz-pkg/types";
import { type BlockStatusKey } from "~/components/common";

/**
 * Native Aztec L2 status is the product-facing block-status source. Orphan
 * state still has visual priority because it is tracked on the block row.
 */
export const blockStatusToDisplay = (
  nativeStatus: ChicmozL2NativeBlockStatus | undefined,
  orphaned?: boolean,
): BlockStatusKey => {
  if (orphaned) {
    return "orphaned";
  }
  switch (nativeStatus ?? "unknown") {
    case "proposed":
      return "proposed";
    case "checkpointed":
      return "checkpointed";
    case "proven":
      return "proven";
    case "finalized":
      return "finalized";
    case "unknown":
      return "unknown";
  }
};
