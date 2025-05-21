import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";
import { useEffect } from "react";
import { Button } from "~/components/ui";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  disableSizeSelector?: boolean;
  disablePagination?: boolean;
  maxEntries?: number;
}

export function DataTablePagination<TData>({
  table,
  disableSizeSelector,
  disablePagination = false,
  maxEntries = 10,
}: DataTablePaginationProps<TData>) {
  const totalRowCount = table.getCoreRowModel().rows.length;
  const pageCount = table.getPageCount();

  useEffect(() => {
    table.setPageSize(maxEntries);
  }, [table, maxEntries, totalRowCount]);

  if (totalRowCount === 0) {
    return null;
  }

  if (pageCount <= 1 && disableSizeSelector) {
    return null;
  }

  return (
    !disablePagination && (
      <div className="flex items-center justify-center px-2 py-4">
        <PaginationControls
          table={table}
          disableSizeSelector={disableSizeSelector}
          maxEntries={maxEntries}
        />
      </div>
    )
  );
}

const PaginationControls = <TData,>({
  table,
}: DataTablePaginationProps<TData>) => {
  const pageCount = table.getPageCount();

  const showNavigation = pageCount > 1;

  return (
    <div className="w-full">
      <div className="flex flex-row justify-center items-center w-full gap-4">
        {showNavigation && (
          <div className="flex justify-center">
            <PageNavigation table={table} />
          </div>
        )}
      </div>
    </div>
  );
};

const PageNavigation = <TData,>({ table }: DataTablePaginationProps<TData>) => {
  const currentPageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

  const getPageNumbers = (): number[] => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    if (currentPageIndex === 0) {
      return [0, 1, 2];
    }

    if (currentPageIndex === totalPages - 1) {
      return [totalPages - 3, totalPages - 2, totalPages - 1];
    }

    return [currentPageIndex - 1, currentPageIndex, currentPageIndex + 1];
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Table pagination"
      className="flex items-center justify-center w-full lg:w-1/3"
    >
      <div className="flex items-center justify-center">
        <Button
          variant="link"
          className="hidden h-8 w-8 p-0 lg:flex items-center justify-center"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label={text.first}
        >
          <ArrowLeftIcon className="h-4 w-4 text-purple-light" />
        </Button>

        <div className="w-16 text-center">
          <Button
            variant="link"
            className="h-8 px-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={text.previous}
          >
            <span className="capitalize text-purple-light">
              {text.previousBtn}
            </span>
          </Button>
        </div>

        <div className="flex items-center justify-center space-x-2 min-w-[120px]">
          {pageNumbers.map((pageIndex) => (
            <div key={pageIndex} className="w-8 text-center">
              <Button
                variant="link"
                className={`h-8 w-8 p-0 flex items-center justify-center ${
                  pageIndex === currentPageIndex
                    ? "bg-purple-500 hover:bg-purple-600 rounded-full"
                    : ""
                }`}
                onClick={() => table.setPageIndex(pageIndex)}
                disabled={false} // Don't disable the current page button
                aria-current={
                  pageIndex === currentPageIndex ? "page" : undefined
                }
                aria-label={
                  pageIndex === currentPageIndex
                    ? `Current page, page ${pageIndex + 1}`
                    : `Go to page ${pageIndex + 1}`
                }
              >
                <span
                  className={
                    pageIndex === currentPageIndex
                      ? "text-white font-bold"
                      : "text-purple-light hover:text-purple-dark"
                  }
                >
                  {pageIndex + 1}
                </span>
              </Button>
            </div>
          ))}
        </div>

        <div className="w-16 text-center">
          <Button
            variant="link"
            className="h-8 px-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={text.next}
          >
            <span className="capitalize text-purple-light">{text.nextBtn}</span>
          </Button>
        </div>

        <Button
          variant="link"
          className="hidden h-8 w-8 p-0 lg:flex items-center justify-center"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          aria-label={text.last}
        >
          <ArrowRightIcon className="h-4 w-4 text-purple-light" />
        </Button>
      </div>
    </nav>
  );
};

const text = {
  previousBtn: "Previous",
  nextBtn: "Next",
  first: "Go to first page",
  previous: "Go to previous page",
  next: "Go to next page",
  last: "Go to last page",
  rowsPerPage: "Rows",
};
