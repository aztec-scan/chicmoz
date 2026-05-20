import { type FC } from "react";

interface Props {
  items: readonly string[];
  emptyMessage: string;
}

/** Index + hex-value rows used by the note-hashes / nullifiers / L2→L1 msg tabs. */
export const HashList: FC<Props> = ({ items, emptyMessage }) => (
  <div>
    {items.map((h, i) => (
      <div key={`${h}-${i}`} className="list-row">
        <span className="idx">{i}</span>
        <span className="v">{h}</span>
      </div>
    ))}
    {items.length === 0 && <div className="empty-state">{emptyMessage}</div>}
  </div>
);
