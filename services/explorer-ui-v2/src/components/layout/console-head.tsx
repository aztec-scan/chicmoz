import { Link } from "@tanstack/react-router";
import { type FC, type ReactNode } from "react";

export interface ConsoleCrumb {
  label: string;
  to?: string;
  active?: boolean;
}

interface Props {
  crumbs: ConsoleCrumb[];
  /** Trailing comment shown after `//` — typically the backing API path. */
  comment?: ReactNode;
}

/** Terminal-style breadcrumb used across detail and list pages. */
export const ConsoleHead: FC<Props> = ({ crumbs, comment }) => (
  <div className="console-head">
    <span className="prompt">$</span> {" "}
    {crumbs.map((c, i) => (
      <span key={`${c.label}-${i}`}>
        {i > 0 && <span className="sep"> › </span>}
        {c.active ? (
          <em>{c.label}</em>
        ) : c.to ? (
          <Link to={c.to}>{c.label}</Link>
        ) : (
          <span>{c.label}</span>
        )}
      </span>
    ))}
    {comment && (
      <>
        {"  "}
        <span className="sep">//</span> {comment}
      </>
    )}
  </div>
);
