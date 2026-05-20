import { Link } from "@tanstack/react-router";
import { type FC } from "react";

export type HealthTab = "network" | "aztecscan";

interface Props {
  active: HealthTab;
}

/** Two-tab pill above the health page content; each tab is its own URL. */
export const HealthTabs: FC<Props> = ({ active }) => (
  <div className="health-tabs">
    <Link
      to="/health"
      className={`health-tab${active === "network" ? " on" : ""}`}
    >
      Network
    </Link>
    <Link
      to="/health/aztecscan"
      className={`health-tab${active === "aztecscan" ? " on" : ""}`}
    >
      Aztec-Scan
    </Link>
  </div>
);
