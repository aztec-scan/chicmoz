import {
  type ChicmozL2BlockFinalizationStatus,
  type ChicmozL2BlockLight,
} from "@chicmoz-pkg/types";

// Define a type for our transformed data structure
export interface BlockWithStatuses {
  block: ChicmozL2BlockLight;
  statuses: ChicmozL2BlockFinalizationStatus[];
}
