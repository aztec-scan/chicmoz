import { type FC, type ReactNode } from "react";

interface Props {
  label: string;
  width?: "wide" | "extra-wide";
  children: ReactNode;
}

/** Single label/value row inside a `kv-grid`. Matches the design's `.kv` markup. */
export const DetailField: FC<Props> = ({ label, width, children }) => (
  <div className={width ? `kv ${width}` : "kv"}>
    <span className="k">{label}</span>
    <span className="v">{children}</span>
  </div>
);
