import { OctagonAlert } from "lucide-react";

interface OrphanedBannerProps {
  type?:
    | "block"
    | "tx-effect"
    | "contract-instance"
    | "contract-class"
    | "pending-tx";
  blockAmount?: number;
}

export const OrphanedBanner: React.FC<OrphanedBannerProps> = ({
  type = "block",
  blockAmount,
}) => {
  const getTitle = () => {
    switch (type) {
      case "tx-effect":
        return "Orphaned Transaction Effect";
      case "contract-instance":
        return "Orphaned Contract Instance";
      case "contract-class":
        return "Orphaned Contract Class";
      case "pending-tx":
        return "Stale transaction";
      default:
        return "Orphaned Block";
    }
  };

  const getMessage = () => {
    switch (type) {
      case "tx-effect":
        return "This transaction effect is from an orphaned block and is no longer part of the canonical chain.";
      case "contract-instance":
        return "This contract instance was deployed in an orphaned block and is no longer part of the canonical chain.";
      case "contract-class":
        return "This contract class was registered in an orphaned block and is no longer part of the canonical chain.";
      case "pending-tx":
        return `This pending transaction has not been included in ${blockAmount} blocks`;
      default:
        return "This block has been orphaned and is no longer part of the canonical chain.";
    }
  };

  return (
    <div className="bg-destructive border border-red-200 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center">
        <OctagonAlert className="w-5 h-5 mr-2" />
        <h3 className="text-lg font-medium">{getTitle()}</h3>
      </div>
      <p className="mt-2 text-sm">{getMessage()}</p>
    </div>
  );
};
