import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { truncateHashString } from "~/lib/utils";

interface BaseProps {
  address: string;
  /** Pass `false` to render the full address. Defaults to truncating. */
  truncate?: boolean;
  className?: string;
}

const display = (address: string, truncate?: boolean): string =>
  truncate === false ? address : truncateHashString(address);

/** Link to the L2 address activity page. */
export const L2AddressLink: FC<BaseProps> = ({
  address,
  truncate,
  className,
}) => (
  <Link
    to="/address/$address"
    params={{ address }}
    className={className}
  >
    {display(address, truncate)}
  </Link>
);

/** Link to the L1 address activity page. */
export const L1AddressLink: FC<BaseProps> = ({
  address,
  truncate,
  className,
}) => (
  <Link
    to="/l1/address/$address"
    params={{ address }}
    className={className}
  >
    {display(address, truncate)}
  </Link>
);

/** Link to the contract instance detail page. */
export const ContractInstanceLink: FC<BaseProps> = ({
  address,
  truncate,
  className,
}) => (
  <Link
    to="/contracts/instances/$address"
    params={{ address }}
    className={className}
  >
    {display(address, truncate)}
  </Link>
);
