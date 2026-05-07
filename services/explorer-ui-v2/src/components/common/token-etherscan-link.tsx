import { type FC } from "react";
import { EtherscanAddressLink } from "./etherscan-address-link";

interface Props {
  symbol: string;
  address?: string;
  className?: string;
}

export const TokenEtherscanLink: FC<Props> = ({
  symbol,
  address,
  className,
}) => {
  if (!address) {
    return <span className={className}>{symbol}</span>;
  }

  return (
    <EtherscanAddressLink
      content={symbol}
      endpoint={`/token/${address}`}
      className={className}
      showExternalLinkIcon={false}
      title="View token on Etherscan"
    />
  );
};
