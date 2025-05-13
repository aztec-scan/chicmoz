import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";
import { useEffect } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui";

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
  disableSizeSelector,
  maxEntries,
}: DataTablePaginationProps<TData>) => {
  const totalRowCount = table.getCoreRowModel().rows.length;
  const pageCount = table.getPageCount();

  // Hide navigation controls if there's only one page
  const showNavigation = pageCount > 1;

  return (
    <div className="w-full">
      {/* Mobile layout as a column */}
      <div className="flex flex-col md:hidden w-full gap-4">
        {/* Navigation centered at top */}
        {showNavigation && (
          <div className="flex justify-center w-full">
            <PageNavigation table={table} />
          </div>
        )}
        
        {/* Size selector left-aligned at bottom */}
        {!disableSizeSelector && (
          <div className="self-start">
            <PageSizeSelector table={table} maxEntries={maxEntries} />
          </div>
        )}
      </div>
      
      {/* Desktop layout side by side */}
      <div className="hidden md:flex items-center justify-between w-full">
        {/* Size selector on left for desktop */}
        {!disableSizeSelector && (
          <div>
            <PageSizeSelector table={table} maxEntries={maxEntries} />
          </div>
        )}
        
        {/* Navigation on right for desktop, or centered if no selector */}
        {showNavigation && (
          <div className={`${!disableSizeSelector ? "" : "mx-auto"}`}>
            <PageNavigation table={table} />
          </div>
        )}
        
        {/* When navigation is hidden but selector is shown, add empty div for spacing */}
        {!showNavigation && !disableSizeSelector && <div className="w-[120px]"></div>}
      </div>
    </div>
  );
};

const PageSizeSelector = <TData,>({
  table,
  maxEntries = 10,
}: DataTablePaginationProps<TData>) => {
  // Get total row count to calculate dynamic options
  const totalRowCount = table.getCoreRowModel().rows.length;
  const currentSize = table.getState().pagination.pageSize;

  // Generate page size options with fixed standard options and dynamic ones
  const generatePageSizeOptions = () => {
    // Standard options that won't exceed total rows
    const standardOptions = [10, 25, 50, 100].filter(
      (size) =>
        // Only include options that don't exceed the total row count
        // Always include at least the 10 option even for small datasets
        size <= totalRowCount || size === 10,
    );

    // Start with filtered standard options
    const options = [...standardOptions];

    // Add current size if not already in options
    if (!options.includes(currentSize)) {
      options.push(currentSize);
    }

    // Add option that shows all rows if not too many and not already included
    if (
      totalRowCount <= 100 &&
      totalRowCount > 0 &&
      !options.includes(totalRowCount)
    ) {
      options.push(totalRowCount);
    }

    // Sort and return unique values
    return [...new Set(options)].sort((a, b) => a - b);
  };

  const pageSizeOptions = generatePageSizeOptions();

  return (
    <div className="flex items-center space-x-2 shrink-0 min-w-[200px]">
      <p className="h-full text-sm text-muted-foreground whitespace-nowrap">
        {text.rowsPerPage}
      </p>
      <Select
        value={`${table.getState().pagination.pageSize}`}
        onValueChange={(value) => table.setPageSize(Number(value))}
      >
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue placeholder={table.getState().pagination.pageSize} />
        </SelectTrigger>
        <SelectContent side="top">
          {pageSizeOptions.map((pageSize) => (
            <SelectItem key={pageSize} value={`${pageSize}`}>
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const PageNavigation = <TData,>({ table }: DataTablePaginationProps<TData>) => {
  const currentPageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

  // Calculate page numbers with validation
  const prevPageNum = Math.max(0, currentPageIndex - 1);
  const currentPageNum = currentPageIndex;
  const nextPageNum = Math.min(totalPages - 1, currentPageIndex + 1);

  // Check if pages should be displayed
  const showPrevPage = currentPageIndex > 0;
  const showNextPage = currentPageIndex < totalPages - 1;

  // Show page count for tables with multiple pages
  const showPageCount = totalPages > 3;

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
        <div className="flex items-center justify-center  min-w-[120px]">
          {/* Page count indicator */}
          {showPageCount && (
            <span className="text-xs text-muted-foreground absolute top-[-18px] w-full text-center">
              Page {currentPageIndex + 1} of {totalPages}
            </span>
          )}

          {/* Previous Page Number */}
          <div className="w-8 text-center">
            {showPrevPage ? (
              <Button
                variant="link"
                className="h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => table.setPageIndex(prevPageNum)}
                disabled={false}
                aria-label={`Go to page ${prevPageNum + 1}`}
              >
                <span className="text-purple-light">{prevPageNum + 1}</span>
              </Button>
            ) : (
              <div className="h-8 w-8"></div>
            )}
          </div>

          {/* Current Page Number */}
          <div className="w-8 text-center">
            <Button
              variant="link"
              className="h-8 w-8 p-0 bg-purple-light rounded-full flex items-center justify-center"
              onClick={() => {
                /* Current page - no action needed */
              }}
              disabled={false}
              aria-current="page"
              aria-label={`Current page, page ${currentPageNum + 1}`}
            >
              <span className="text-white font-medium">
                {currentPageNum + 1}
              </span>
            </Button>
          </div>

          {/* Next Page Number */}
          <div className="w-8 text-center">
            {showNextPage ? (
              <Button
                variant="link"
                className="h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => table.setPageIndex(nextPageNum)}
                disabled={false}
                aria-label={`Go to page ${nextPageNum + 1}`}
              >
                <span className="text-purple-light">{nextPageNum + 1}</span>
              </Button>
            ) : (
              <div className="h-8 w-8"></div>
            )}
          </div>
        </div>

        <div className="w-8 text-center">
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
