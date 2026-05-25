import { type FC } from "react";

interface SkeletonProps {
  /** CSS width value, e.g. "60%", "120px". Defaults to "100%". */
  width?: string;
  /** CSS height value. Defaults to "1em". */
  height?: string;
  className?: string;
}

/** Single shimmer placeholder bar. */
export const Skeleton: FC<SkeletonProps> = ({
  width = "100%",
  height = "1em",
  className,
}) => (
  <span
    className={className ? `skeleton ${className}` : "skeleton"}
    style={{ width, height }}
    aria-hidden="true"
  />
);

interface SkeletonRowsProps {
  /** Number of shimmer rows to render. Defaults to 10. */
  count?: number;
  /**
   * CSS grid-template-columns value that controls column widths.
   * Should match the real row's grid so the skeleton looks right.
   * Defaults to a generic two-column stretch.
   */
  columns?: string;
  /** Number of skeleton cells per row. Defaults to 3. */
  cells?: number;
}

/**
 * Renders `count` shimmer rows styled like `.row` list items.
 * Drop inside any `.rows` container while data is loading.
 */
export const SkeletonRows: FC<SkeletonRowsProps> = ({
  count = 10,
  columns = "minmax(0,1fr) 100px 80px",
  cells = 3,
}) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="row skeleton-row"
        style={{ gridTemplateColumns: columns }}
        aria-hidden="true"
      >
        {Array.from({ length: cells }, (__, j) => (
          <Skeleton key={j} width={j === 0 ? "70%" : "60%"} height="12px" />
        ))}
      </div>
    ))}
  </>
);
