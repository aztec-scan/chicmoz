import {
  type ChicmozL2BlockLight,
  type ChicmozL2NativeBlockStatus,
} from "@chicmoz-pkg/types";

// Define a type for our transformed data structure
export interface BlockWithStatuses {
  block: ChicmozL2BlockLight;
  statuses: ChicmozL2NativeBlockStatus[];
}
