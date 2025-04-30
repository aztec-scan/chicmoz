import { OctagonAlert } from "lucide-react";

interface DroppedBannerProps {
  reason?: string;
}

export const DroppedBanner: React.FC<DroppedBannerProps> = ({ reason }) => {
  return (
    <div className="bg-destructive border border-red-200 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center">
        <OctagonAlert className="w-5 h-5 mr-2" />
        <h3 className="text-lg font-medium">Dropped Transaction</h3>
      </div>
      <p className="mt-2 text-sm">
        This transaction was dropped and did not produce a transaction effect.
        {reason ? ` Reason: ${reason}` : ""}
      </p>
    </div>
  );
};
