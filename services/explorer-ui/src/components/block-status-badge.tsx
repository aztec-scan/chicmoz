import { type ChicmozL2NativeBlockStatus } from "@chicmoz-pkg/types";
import { CustomTooltip } from "./custom-tooltip";

interface BlockStatusBadgeProps {
  nativeStatus?: ChicmozL2NativeBlockStatus;
  className?: string;
  orphan?: boolean;
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
  nativeStatus,
  className = "",
  orphan = false,
}) => {
  let badgeText = "Unknown";
  let badgeStyle = gray;
  let tooltipText = "Aztecscan block status";

  if (orphan) {
    badgeText = "Orphaned";
    badgeStyle = gray;
    tooltipText = "Block has been reorged out of the canonical chain";
  } else {
    switch (nativeStatus ?? "unknown") {
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
