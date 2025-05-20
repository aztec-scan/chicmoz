import { L1L2ValidatorStatus } from "@chicmoz-pkg/types";
import { CustomTooltip } from "./custom-tooltip";

interface ValidatorStatusBadgeProps {
  status: L1L2ValidatorStatus;
  className?: string;
}

const red = {
  backgroundColor: "#FEE2E2",
  color: "#991B1B",
  borderColor: "#EF4444",
};

const orange = {
  backgroundColor: "#FFEDD5",
  color: "#9A3412",
  borderColor: "#F97316",
};

const green = {
  backgroundColor: "#DCFCE7",
  color: "#166534",
  borderColor: "#22C55E",
};

const gray = {
  backgroundColor: "#F3F4F6",
  color: "#1F2937",
  borderColor: "#6B7280",
};

export const ValidatorStatusBadge: React.FC<ValidatorStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  let badgeText = "Unknown";
  let badgeStyle = gray;
  let tooltipText = "Validator status";

  switch (status) {
    case L1L2ValidatorStatus.VALIDATING:
      badgeText = "VALIDATING";
      badgeStyle = green;
      tooltipText = "Participating as validator";
      break;
    case L1L2ValidatorStatus.LIVING:
      badgeText = "LIVING";
      badgeStyle = orange;
      tooltipText = "Not participating as validator, but have funds in setup";
      break;
    case L1L2ValidatorStatus.EXITING:
      badgeText = "EXITING";
      badgeStyle = red;
      tooltipText = "In the process of exiting the system";
      break;
    case L1L2ValidatorStatus.NONE:
      badgeText = "NONE";
      badgeStyle = gray;
      tooltipText =
        "This status is not currently used in the l1-contract (and should not occurr)";
      break;
  }

  return (
    <CustomTooltip content={tooltipText}>
      <span
        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border ${className}`}
        style={badgeStyle}
      >
        {badgeText}
      </span>
    </CustomTooltip>
  );
};
