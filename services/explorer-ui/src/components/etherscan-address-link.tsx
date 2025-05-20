import { getL1NetworkId } from "@chicmoz-pkg/types";
import { ExternalLink } from "lucide-react";
import { L2_NETWORK_ID } from "~/service/constants";
import { CustomTooltip } from "./custom-tooltip";

interface EtherscanAddressLinkProps {
  content: string;
  endpoint: string;
  className?: string;
}

const ETHERSCAN_URL =
  getL1NetworkId(L2_NETWORK_ID) === "ETH_SEPOLIA" ||
  getL1NetworkId(L2_NETWORK_ID) === "ETH_MAINNET"
    ? getL1NetworkId(L2_NETWORK_ID) === "ETH_MAINNET"
      ? "https://etherscan.io"
      : "https://sepolia.etherscan.io"
    : undefined;

export const EtherscanAddressLink: React.FC<EtherscanAddressLinkProps> = ({
  content,
  endpoint,
}) => {
  if (!ETHERSCAN_URL) {
    return <div className="font-mono">{content}</div>;
  }
  return (
    <CustomTooltip content={`View on Etherscan`}>
      <a
        href={`${ETHERSCAN_URL}${endpoint}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-light font-mono inline-flex items-center gap-1"
      >
        {content}
        <ExternalLink size={14} className="text-purple-light" />
      </a>
    </CustomTooltip>
  );
};
