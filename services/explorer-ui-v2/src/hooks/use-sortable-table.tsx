import { type ReactNode, useState } from "react";

export type SortDir = "asc" | "desc";

interface UseSortableTable<K extends string> {
  sortKey: K;
  sortDir: SortDir;
  setSortKey: (k: K) => void;
  setSortDir: (d: SortDir) => void;
  toggleSort: (k: K) => void;
  /** Returns the ↑/↓ arrow span if `k` is the active sort key, else null. */
  sortArrow: (k: K) => ReactNode;
}

/**
 * Shared sort state + toggle/arrow helpers for table headers. Clicking the
 * active key flips direction; clicking a different key resets to "desc".
 */
export const useSortableTable = <K extends string>(
  initialKey: K,
  initialDir: SortDir = "desc",
): UseSortableTable<K> => {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const toggleSort = (k: K): void => {
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const sortArrow = (k: K): ReactNode =>
    sortKey === k ? (
      <span className="arr">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : null;

  return { sortKey, sortDir, setSortKey, setSortDir, toggleSort, sortArrow };
};
