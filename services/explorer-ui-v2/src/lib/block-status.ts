import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";

/**
 * Collapse the 6-level finalization enum into the 4 display buckets used by
 * the design (`proposed`, `proven`, `finalized`, `orphaned`). Orphan state is
 * tracked on the block itself, not in the enum — callers pass `orphaned: true`
 * when they know a block was orphaned.
 */
export const blockStatusToDisplay = (
  status: ChicmozL2BlockFinalizationStatus | undefined,
  orphaned?: boolean,
): "proposed" | "proven" | "finalized" | "orphaned" | "pending" => {
  if (orphaned) {return "orphaned";}
  if (status === undefined) {return "pending";}
  switch (status) {
    case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED:
    case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROPOSED:
      return "proposed";
    case ChicmozL2BlockFinalizationStatus.L1_MINED_PROPOSED:
    case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN:
    case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROVEN:
      return "proven";
    case ChicmozL2BlockFinalizationStatus.L1_MINED_PROVEN:
      return "finalized";
    default:
      return "pending";
  }
};
