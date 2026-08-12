import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

function getPaginationRange(
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

const navBtnClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-main bg-panel-bg text-icon-muted transition-colors hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus-ring disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

const pageBtnClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border-main bg-panel-bg px-2 text-sm font-medium text-text-muted transition-colors hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus-ring cursor-pointer";

const pageBtnActiveClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-brand-soft-border bg-role-active-bg px-2 text-sm font-semibold text-role-active-text cursor-default";

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [7, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className = "",
}: PaginationProps) {
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  const pageNumbers = useMemo(
    () => getPaginationRange(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const safePage = totalPages === 0 ? 0 : currentPage;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pageSizeRef.current &&
        !pageSizeRef.current.contains(event.target as Node)
      ) {
        setPageSizeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (totalPages === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-4 border-t border-border-main/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-sm text-text-muted">
        {totalPages === 0 ? "Page 0 of 0" : `Page ${safePage} of ${totalPages}`}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          className={navBtnClass}
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navBtnClass}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageNumbers.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border-main bg-panel-bg px-2 text-sm text-text-muted"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={page === currentPage ? pageBtnActiveClass : pageBtnClass}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          className={navBtnClass}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navBtnClass}
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      <div className="relative self-end sm:self-auto" ref={pageSizeRef}>
        <button
          type="button"
          onClick={() => setPageSizeOpen((open) => !open)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-main bg-panel-bg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-brand-soft hover:text-text-main focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus-ring cursor-pointer"
          aria-haspopup="listbox"
          aria-expanded={pageSizeOpen}
        >
          {pageSize} / page
          <ChevronDown
            className={`h-4 w-4 transition-transform ${pageSizeOpen ? "rotate-180" : ""}`}
          />
        </button>

        {pageSizeOpen && (
          <ul
            role="listbox"
            className="absolute bottom-full right-0 z-20 mb-1 min-w-full overflow-hidden rounded-lg border border-border-main bg-panel-bg py-1 shadow-lg"
          >
            {pageSizeOptions.map((size) => (
              <li key={size} role="option" aria-selected={size === pageSize}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                    size === pageSize
                      ? "bg-role-active-bg font-semibold text-role-active-text"
                      : "text-text-muted hover:bg-brand-soft hover:text-text-main"
                  }`}
                  onClick={() => {
                    onPageSizeChange(size);
                    setPageSizeOpen(false);
                  }}
                >
                  {size} / page
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    paginatedItems: items.slice(start, start + pageSize),
    totalPages: items.length === 0 ? 0 : totalPages,
    safePage,
    startIndex: items.length === 0 ? 0 : start + 1,
    endIndex: Math.min(start + pageSize, items.length),
  };
}
