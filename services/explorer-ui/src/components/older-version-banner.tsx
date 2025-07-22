import { Info } from "lucide-react";

interface OlderVersionBannerProps {
  blockVersion: number;
  chainVersion: bigint;
}

export const OlderVersionBanner: React.FC<OlderVersionBannerProps> = ({
  blockVersion,
  chainVersion,
}) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center">
        <Info className="w-5 h-5 mr-2 text-amber-600" />
        <h3 className="text-lg font-medium text-amber-800">
          Older Version Block
        </h3>
      </div>
      <p className="mt-2 text-sm text-amber-700">
        This block was created with an earlier version of the rollup protocol. Block
        rollup version: {blockVersion}, current protocol version:{" "}
        {chainVersion.toString()}.
      </p>
    </div>
  );
};
