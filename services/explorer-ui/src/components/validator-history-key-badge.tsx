import { CustomTooltip } from "./custom-tooltip";

interface ValidatorHistoryKeyBadgeProps {
  keyChanged: string;
  className?: string;
}

export const ValidatorHistoryKeyBadge: React.FC<
  ValidatorHistoryKeyBadgeProps
> = ({ keyChanged, className = "" }) => {
  let badgeStyle = {
    backgroundColor: "#F3F4F6",
    color: "#1F2937",
    borderColor: "#6B7280",
  };

  let tooltipText = `Property "${keyChanged}" was changed`;

  // Determine badge color based on key type
  switch (keyChanged) {
    case "status":
      badgeStyle = {
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        borderColor: "#F59E0B",
      };
      tooltipText = "Validator status change";
      break;
    case "stake":
      badgeStyle = {
        backgroundColor: "#DCFCE7",
        color: "#166534",
        borderColor: "#22C55E",
      };
      tooltipText = "Stake amount change";
      break;
    case "proposer":
      badgeStyle = {
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
        borderColor: "#EF4444",
      };
      tooltipText = "Proposer address change";
      break;
    case "withdrawer":
      badgeStyle = {
        backgroundColor: "#FFEDD5",
        color: "#9A3412",
        borderColor: "#F97316",
      };
      tooltipText = "Withdrawer address change";
      break;
  }

  return (
    <CustomTooltip content={tooltipText}>
      <span
        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border ${className}`}
        style={badgeStyle}
      >
        {keyChanged}
      </span>
    </CustomTooltip>
  );
};
