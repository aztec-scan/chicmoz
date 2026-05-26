import { type FC } from "react";

interface Props {
  page: number;
  totalPages?: number;
  hasMore?: boolean;
  onPageChange: (next: number) => void;
}

export const Pagination: FC<Props> = ({
  page,
  totalPages,
  hasMore,
  onPageChange,
}) => {
  const hasTotal = totalPages !== undefined && totalPages > 1;
  const atFirst = page === 0;
  const atLast = hasTotal && page >= totalPages - 1;
  const canGoNext = hasTotal ? !atLast : (hasMore ?? true);

  if (hasTotal) {
    const start = Math.max(0, Math.min(totalPages - 5, page - 2));
    const visible = Array.from(
      { length: Math.min(5, totalPages) },
      (_, i) => start + i,
    ).filter((n) => n < totalPages);

    return (
      <div className="pagination">
        <div>
          page {page + 1} of {totalPages}
        </div>
        <div className="pages">
          <button
            title="first page"
            onClick={() => onPageChange(0)}
            disabled={atFirst}
          >
            «
          </button>
          <button
            title="previous page"
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={atFirst}
          >
            ‹
          </button>
          {visible.map((n) => (
            <button
              key={n}
              className={page === n ? "on" : ""}
              onClick={() => onPageChange(n)}
            >
              {n + 1}
            </button>
          ))}
          <button
            title="next page"
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={atLast}
          >
            ›
          </button>
          <button
            title="last page"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={atLast}
          >
            »
          </button>
        </div>
      </div>
    );
  }

  // Filtered view: no known total, only prev/next navigation.
  return (
    <div className="pagination">
      <div>page {page + 1}</div>
      <div className="pages">
        <button
          title="first page"
          onClick={() => onPageChange(0)}
          disabled={atFirst}
        >
          «
        </button>
        <button
          title="previous page"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={atFirst}
        >
          ‹
        </button>
        <button
          title="next page"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          ›
        </button>
        <button title="last page" disabled>
          »
        </button>
      </div>
    </div>
  );
};
