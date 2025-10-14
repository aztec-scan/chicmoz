import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui";

interface ReactQueryPaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export function ReactQueryPagination({
  currentPage,
  onPageChange,
  hasNextPage = true,
  hasPreviousPage = true,
}: ReactQueryPaginationProps) {
  const canGoPrevious = hasPreviousPage && currentPage > 0;
  const canGoNext = hasNextPage;

  const getPageNumbers = (): number[] => {
    // Show current page and 2 pages around it
    const start = Math.max(0, currentPage - 1);
    const end = currentPage + 2;
    return Array.from({ length: end - start }, (_, i) => start + i);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center px-2 py-4">
      <nav
        aria-label="Table pagination"
        className="flex items-center justify-center w-full lg:w-1/3"
      >
        <div className="flex items-center justify-center">
          <Button
            variant="link"
            className="hidden h-8 w-8 p-0 lg:flex items-center justify-center"
            onClick={() => onPageChange(0)}
            disabled={!canGoPrevious}
            aria-label="Go to first page"
          >
            <ArrowLeftIcon className="h-4 w-4 text-purple-light" />
          </Button>

          <div className="w-16 text-center">
            <Button
              variant="link"
              className="h-8 px-1"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canGoPrevious}
              aria-label="Go to previous page"
            >
              <span className="capitalize text-purple-light">Previous</span>
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-2 min-w-[120px]">
            {pageNumbers.map((pageIndex) => (
              <div key={pageIndex} className="w-8 text-center">
                <Button
                  variant="link"
                  className={`h-8 w-8 p-0 flex items-center justify-center ${
                    pageIndex === currentPage
                      ? "bg-purple-500 hover:bg-purple-600 rounded-full"
                      : ""
                  }`}
                  onClick={() => onPageChange(pageIndex)}
                  aria-current={pageIndex === currentPage ? "page" : undefined}
                  aria-label={
                    pageIndex === currentPage
                      ? `Current page, page ${pageIndex + 1}`
                      : `Go to page ${pageIndex + 1}`
                  }
                >
                  <span
                    className={
                      pageIndex === currentPage
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              aria-label="Go to next page"
            >
              <span className="capitalize text-purple-light">Next</span>
            </Button>
          </div>

          <Button
            variant="link"
            className="hidden h-8 w-8 p-0 lg:flex items-center justify-center"
            onClick={() => onPageChange(currentPage + 10)} // Go forward 10 pages
            disabled={!canGoNext}
            aria-label="Go forward 10 pages"
          >
            <ArrowRightIcon className="h-4 w-4 text-purple-light" />
          </Button>

          <Button
            variant="link"
            className="hidden h-8 w-8 p-0 lg:flex items-center justify-center ml-2"
            onClick={() => onPageChange(999)} // Go to last page (high number)
            disabled={!canGoNext}
            aria-label="Go to last page"
          >
            <span className="text-purple-light text-xs font-bold">Last</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
