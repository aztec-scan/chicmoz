import { useState } from "react";

interface UsePaginated<T> {
  page: number;
  setPage: (n: number) => void;
  paged: T[];
  totalPages: number;
}

/**
 * Client-side slice pagination for an already-filtered/sorted array. Server-
 * paginated lists (e.g. blocks) compute their own totalPages and shouldn't
 * use this. Resetting `page` on filter changes stays the caller's job — it
 * varies per page (multiple filter sources, different reset semantics).
 */
export const usePaginated = <T>(items: T[], pageSize: number): UsePaginated<T> => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = items.slice(page * pageSize, (page + 1) * pageSize);
  return { page, setPage, paged, totalPages };
};
