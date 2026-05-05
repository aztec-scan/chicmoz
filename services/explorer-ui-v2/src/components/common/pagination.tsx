import { type FC } from "react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}

export const Pagination: FC<Props> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) {return null;}
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
        <button onClick={() => onPageChange(0)} disabled={page === 0}>
          «
        </button>
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
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
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
        >
          »
        </button>
      </div>
    </div>
  );
};
