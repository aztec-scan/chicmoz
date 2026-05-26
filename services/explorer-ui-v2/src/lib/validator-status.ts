import { L1L2ValidatorStatus } from "@chicmoz-pkg/types";

/** Display bucket for a validator's status enum. */
export const validatorStatusToDisplay = (
  status: L1L2ValidatorStatus | number | undefined,
): "validating" | "living" | "exiting" | "registered" | "zombie" | "pending" => {
  switch (status) {
    case L1L2ValidatorStatus.VALIDATING:
      return "validating";
    case L1L2ValidatorStatus.LIVING:
      return "living";
    case L1L2ValidatorStatus.EXITING:
      return "exiting";
    case L1L2ValidatorStatus.NONE:
      return "registered";
    default:
      return "pending";
  }
};
