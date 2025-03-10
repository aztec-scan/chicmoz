import { ChicmozL2BlockFinalizationStatus } from "@chicmoz-pkg/types";


interface BlockStatusBadgeProps {
  status: ChicmozL2BlockFinalizationStatus;
  className?: string;
}

export const BlockStatusBadge: React.FC<BlockStatusBadgeProps> = ({ status, className = "" }) => {
  let badgeText = "Unknown";
  let badgeStyle = {};

  switch (status) {
    case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROPOSED:
      badgeText = "L2 Proposed";
      badgeStyle = {
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
        borderColor: "#EF4444"
      };
      break;
    case ChicmozL2BlockFinalizationStatus.L2_NODE_SEEN_PROVEN:
      badgeText = "L2 Proven";
      badgeStyle = {
        backgroundColor: "#FFEDD5",
        color: "#9A3412",
        borderColor: "#F97316"
      };
      break;
    case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROPOSED:
      badgeText = "L1 Proposed";
      badgeStyle = {
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        borderColor: "#F59E0B"
      };
      break;
    case ChicmozL2BlockFinalizationStatus.L1_SEEN_PROVEN:
      badgeText = "L1 Proven";
      badgeStyle = {
        backgroundColor: "#FEF9C3",
        color: "#854D0E",
        borderColor: "#EAB308"
      };
      break;
    case ChicmozL2BlockFinalizationStatus.L1_MINED_PROPOSED:
      badgeText = "L1 Mined (Proposed)";
      badgeStyle = {
        backgroundColor: "#CCFBF1",
        color: "#115E59",
        borderColor: "#14B8A6"
      };
      break;
    case ChicmozL2BlockFinalizationStatus.L1_MINED_PROVEN:
      badgeText = "L1 Mined (Proven)";
      badgeStyle = {
        backgroundColor: "#DCFCE7",
        color: "#166534",
        borderColor: "#22C55E"
      };
      break;
    default:
      badgeStyle = {
        backgroundColor: "#F3F4F6",
        color: "#1F2937",
        borderColor: "#6B7280"
      };
  }

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border ${className}`}
      style={badgeStyle}
    >
      {badgeText}
    </span>
  );
};

