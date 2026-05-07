import { getL1NetworkId } from "@chicmoz-pkg/types";
import { ExternalLink } from "lucide-react";
import { type FC } from "react";
import { L2_NETWORK_ID } from "~/service/constants";

interface Props {
  content: string;
  endpoint: string;
  className?: string;
  showExternalLinkIcon?: boolean;
  title?: string;
}

const ETHERSCAN_URL = (() => {
  const l1NetworkId = getL1NetworkId(L2_NETWORK_ID);
  if (l1NetworkId === "ETH_MAINNET") {
    return "https://etherscan.io";
  }
  if (l1NetworkId === "ETH_SEPOLIA") {
    return "https://sepolia.etherscan.io";
  }
  return undefined;
})();

export const EtherscanAddressLink: FC<Props> = ({
  content,
  endpoint,
  className,
  showExternalLinkIcon = true,
  title = "View on Etherscan",
}) => {
  const cls = `etherscan-link${className ? ` ${className}` : ""}`;

  if (!ETHERSCAN_URL) {
    return <span className={className}>{content}</span>;
  }

  return (
    <a
      href={`${ETHERSCAN_URL}${endpoint}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      title={title}
      aria-label={title}
    >
      <span>{content}</span>
      {showExternalLinkIcon ? <ExternalLink size={12} aria-hidden /> : null}
    </a>
  );
};
