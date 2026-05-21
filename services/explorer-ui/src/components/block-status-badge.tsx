import {
  ChicmozL2BlockFinalizationStatus,
  type ChicmozL2NativeBlockStatus,
} from "@chicmoz-pkg/types";
import { CustomTooltip } from "./custom-tooltip";

interface BlockStatusBadgeProps {
  status: ChicmozL2BlockFinalizationStatus;
  nativeStatus?: ChicmozL2NativeBlockStatus;
  className?: string;
  useSimplifiedStatuses?: boolean;
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

const blue = {
  backgroundColor: "#DBEAFE",
  color: "#1E40AF",
  borderColor: "#3B82F6",
};

export const BlockStatusBadge: React.FC<BlockStatusBadgeProps> = ({
  status,
  nativeStatus,
  className = "",
  useSimplifiedStatuses = true,
}) => {
  let badgeText = "Unknown";
  let badgeStyle = {};
  let tooltipText = "Aztecscan block status";

  if (nativeStatus) {
    switch (nativeStatus) {
      case "proposed":
        badgeText = "Proposed";
        badgeStyle = red;
        tooltipText = "Block is at or below the Aztec node proposed tip";
        break;
      case "checkpointed":
        badgeText = "Checkpointed";
        badgeStyle = blue;
        tooltipText = "Block is at or below the Aztec node checkpointed tip";
        break;
      case "proven":
        badgeText = "Proven";
        badgeStyle = orange;
        tooltipText = "Block is at or below the Aztec node proven tip";
        break;
      case "finalized":
        badgeText = "Finalized";
        badgeStyle = green;
        tooltipText = "Block is at or below the Aztec node finalized tip";
        break;
      case "unknown":
        badgeText = "Unknown";
        badgeStyle = gray;
        tooltipText = "Native L2 tip status is currently unavailable";
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
  }

  if (useSimplifiedStatuses) {
    switch (status) {
      case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED:
        badgeText = "Proposed";
        badgeStyle = red;
        break;
      case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROPOSED:
        badgeText = "Proposed";
        badgeStyle = red;
        break;
      case ChicmozL2BlockFinalizationStatus.L1_MINED_PROPOSED:
        badgeText = "Proposed";
        badgeStyle = red;
        break;
      case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN:
        badgeText = "Preconfirmed";
        badgeStyle = orange;
        break;
      case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROVEN:
        badgeText = "Preconfirmed";
        badgeStyle = orange;
        break;
      default:
        badgeText = "Finalized";
        badgeStyle = green;
    }
  } else {
    switch (status) {
      case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED:
        badgeText = "L2 Proposed";
        badgeStyle = {
          backgroundColor: "#FEE2E2",
          color: "#991B1B",
          borderColor: "#EF4444",
        };
        break;
      case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN:
        badgeText = "L2 Proven";
        badgeStyle = {
          backgroundColor: "#FFEDD5",
          color: "#9A3412",
          borderColor: "#F97316",
        };
        break;
      case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROPOSED:
        badgeText = "L1 Proposed";
        badgeStyle = {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
          borderColor: "#F59E0B",
        };
        break;
      case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROVEN:
        badgeText = "L1 Proven";
        badgeStyle = {
          backgroundColor: "#FEF9C3",
          color: "#854D0E",
          borderColor: "#EAB308",
        };
        break;
      case ChicmozL2BlockFinalizationStatus.L1_MINED_PROPOSED:
        badgeText = "L1 Mined (Proposed)";
        badgeStyle = {
          backgroundColor: "#CCFBF1",
          color: "#115E59",
          borderColor: "#14B8A6",
        };
        break;
      case ChicmozL2BlockFinalizationStatus.L1_MINED_PROVEN:
        badgeText = "L1 Mined (Proven)";
        badgeStyle = {
          backgroundColor: "#DCFCE7",
          color: "#166534",
          borderColor: "#22C55E",
        };
        break;
      default:
        badgeStyle = {
          backgroundColor: "#F3F4F6",
          color: "#1F2937",
          borderColor: "#6B7280",
        };
    }
  }

  if (useSimplifiedStatuses) {
    if (badgeText === "Proposed") {
      tooltipText = "Block is proposed on L2, waiting to be proven";
    } else if (badgeText === "Preconfirmed") {
      tooltipText = "Block is proven, waiting to be finalized on L1";
    } else {
      tooltipText = "Block is finalized on L1";
    }
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
