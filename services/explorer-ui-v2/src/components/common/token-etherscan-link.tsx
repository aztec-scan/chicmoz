import { type FC } from "react";
import { EtherscanAddressLink } from "./etherscan-address-link";

type EtherscanResource = "address" | "block" | "token" | "tx";

interface EtherscanResourceLinkProps {
  content: string;
  address?: string;
  resource: EtherscanResource;
  className?: string;
  showExternalLinkIcon?: boolean;
  title?: string;
}

export const EtherscanResourceLink: FC<EtherscanResourceLinkProps> = ({
  content,
  address,
  resource,
  className,
  showExternalLinkIcon = false,
  title,
}) => {
  if (!address) {
    return <span className={className}>{content}</span>;
  }

  return (
    <EtherscanAddressLink
      content={content}
      endpoint={`/${resource}/${address}`}
      className={className}
      showExternalLinkIcon={showExternalLinkIcon}
      title={title ?? `View ${resource} on Etherscan`}
    />
  );
};

interface TokenEtherscanLinkProps {
  symbol: string;
  address?: string;
  className?: string;
}

export const TokenEtherscanLink: FC<TokenEtherscanLinkProps> = ({
  symbol,
  address,
  className,
}) => (
  <EtherscanResourceLink
    content={symbol}
    address={address}
    resource="token"
    className={className}
    title="View token on Etherscan"
  />
);

interface AddressEtherscanLinkProps {
  address?: string;
  content?: string;
  className?: string;
  showExternalLinkIcon?: boolean;
  title?: string;
}

export const AddressEtherscanLink: FC<AddressEtherscanLinkProps> = ({
  address,
  content,
  className,
  showExternalLinkIcon,
  title,
}) => (
  <EtherscanResourceLink
    content={content ?? address ?? "—"}
    address={address}
    resource="address"
    className={className}
    showExternalLinkIcon={showExternalLinkIcon}
    title={title ?? "View address on Etherscan"}
  />
);

interface TxEtherscanLinkProps {
  txHash?: string;
  content?: string;
  className?: string;
  showExternalLinkIcon?: boolean;
  title?: string;
  eventLog?: boolean;
}

export const TxEtherscanLink: FC<TxEtherscanLinkProps> = ({
  txHash,
  content,
  className,
  showExternalLinkIcon,
  title,
  eventLog = false,
}) => {
  if (!txHash) {
    return <span className={className}>{content ?? "—"}</span>;
  }

  return (
    <EtherscanAddressLink
      content={content ?? txHash}
      endpoint={`/tx/${txHash}${eventLog ? "#eventlog" : ""}`}
      className={className}
      showExternalLinkIcon={showExternalLinkIcon}
      title={title ?? "View transaction on Etherscan"}
    />
  );
};
