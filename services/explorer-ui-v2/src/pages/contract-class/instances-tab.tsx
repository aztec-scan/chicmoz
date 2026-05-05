import { type ChicmozL2ContractInstanceDeluxe } from "@chicmoz-pkg/types";
import { Link } from "@tanstack/react-router";
import { type FC } from "react";
import { truncateHashString } from "~/lib/utils";

interface Props {
  instances: ChicmozL2ContractInstanceDeluxe[] | undefined;
}

export const InstancesTab: FC<Props> = ({ instances }) => {
  const rows = instances ?? [];
  return (
    <>
      <div className="inst-head">
        <div>Address</div>
        <div className="right">Deployer</div>
        <div className="right">Status</div>
      </div>
      {rows.map((i) => (
        <Link
          key={i.address}
          className="inst-row"
          to="/contracts/instances/$address"
          params={{ address: i.address }}
        >
          <span className="hash">{i.address}</span>
          <span className="num">{truncateHashString(i.deployer, 8, 6)}</span>
          <span className="age">{i.isOrphaned ? "orphaned" : "active"}</span>
        </Link>
      ))}
      {rows.length === 0 && <div className="empty-state">no instances</div>}
    </>
  );
};
