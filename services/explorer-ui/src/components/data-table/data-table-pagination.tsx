import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";
import { useEffect } from "react";
import { Button } from "~/components/ui";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  disableSizeSelector?: boolean;
  maxEntries?: number;
}

export function DataTablePagination<TData>({
  table,
  disableSizeSelector,
  maxEntries = 10,
}: DataTablePaginationProps<TData>) {
  const totalRowCount = table.getCoreRowModel().rows.length;
  const pageCount = table.getPageCount();

  // Set page size based on data length for tables with 20 or fewer rows
  useEffect(() => {
    // Only auto-set page size if maxEntries is not explicitly provided
    if (maxEntries === 10 && totalRowCount > 0 && totalRowCount <= 20) {
      // For tables with up to 20 rows, show all rows without pagination
      // But only if maxEntries wasn't explicitly set (using default value)
      table.setPageSize(totalRowCount);
    } else {
      // Otherwise use the specified maxEntries
      table.setPageSize(maxEntries);
    }
  }, [table, maxEntries, totalRowCount]);

  // Don't show pagination if there's no data or only one page
  if (totalRowCount === 0) {
    return null;
  }

  // Hide pagination if there's only one page and no size selector needed
  // This simplifies the UI when pagination isn't necessary
  if (pageCount <= 1 && disableSizeSelector) {
    return null;
  }

  return (
    <div className="flex items-center justify-center px-2 py-4 border-t">
      <PaginationControls
        table={table}
        disableSizeSelector={disableSizeSelector}
        maxEntries={maxEntries}
      />
    </div>
  );
}

const PaginationControls = <TData,>({
  table,
}: DataTablePaginationProps<TData>) => {
  const pageCount = table.getPageCount();

  // Hide navigation controls if there's only one page
  const showNavigation = pageCount > 1;

  return (
    <div className="w-full">
      <div className="flex flex-row justify-center items-center w-full gap-4">
        {/* Navigation centered */}
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

  // Calculate which 3 page numbers to show
  const getPageNumbers = (): number[] => {
    // If less than 3 pages total, just return all page indices
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // If at the start, show first 3 pages
    if (currentPageIndex === 0) {
      return [0, 1, 2];
    }

    // If at the end, show last 3 pages
    if (currentPageIndex === totalPages - 1) {
      return [totalPages - 3, totalPages - 2, totalPages - 1];
    }

    // Otherwise show current page and one on each side
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

        {/* Fixed width placeholder for page numbers */}
        <div className="flex items-center justify-center space-x-2 min-w-[120px]">
          {/* Always show 3 page numbers */}
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
