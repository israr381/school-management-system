import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  className?: string;
  emptyContent?: ReactNode;
}

function compareValues(
  a: string | number | Date | null | undefined,
  b: string | number | Date | null | undefined
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (a instanceof Date || b instanceof Date) {
    const aTime = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const bTime = b instanceof Date ? b.getTime() : new Date(b).getTime();
    return aTime - bTime;
  }

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function SortIcon({
  direction,
  active,
}: {
  direction: SortDirection | null;
  active: boolean;
}) {
  const iconClass = `w-3.5 h-3.5 transition-colors ${
    active
      ? "text-text-main opacity-100"
      : "text-icon-muted opacity-70 group-hover/icon:opacity-100 group-hover/icon:text-text-main"
  }`;

  if (direction === "asc") {
    return <ArrowUp className={iconClass} />;
  }
  if (direction === "desc") {
    return <ArrowDown className={iconClass} />;
  }
  return <ArrowUpDown className={iconClass} />;
}

export default function Table<T>({
  columns,
  data,
  rowKey,
  className = "",
  emptyContent,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);

  let sortedData = data;
  if (sortKey && sortDirection) {
    const column = columns.find((col) => col.key === sortKey);
    if (column?.sortable) {
      const getValue =
        column.sortValue ??
        ((row: T) =>
          (row as Record<string, unknown>)[column.key] as
            | string
            | number
            | Date
            | null
            | undefined);

      sortedData = [...data].sort((a, b) => {
        const result = compareValues(getValue(a), getValue(b));
        return sortDirection === "asc" ? result : -result;
      });
    }
  }

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;

    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortKey(null);
    setSortDirection(null);
  };

  if (data.length === 0 && emptyContent) {
    return <>{emptyContent}</>;
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-surface-soft text-sm font-medium text-text-main">
            {columns.map((column, index) => {
              const isActive = sortKey === column.key;
              const direction = isActive ? sortDirection : null;
              const isFirst = index === 0;
              const isLast = index === columns.length - 1;

              return (
                <th
                  key={column.key}
                  className={`px-5 py-3.5 whitespace-nowrap ${
                    isFirst ? "rounded-l-xl pl-6" : ""
                  } ${isLast ? "rounded-r-xl pr-6" : ""} ${column.headerClassName ?? ""}`}
                  aria-sort={
                    column.sortable
                      ? direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : "none"
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{column.header}</span>
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="group/icon inline-flex cursor-pointer p-0.5 rounded"
                        aria-label={`Sort by ${column.header}`}
                      >
                        <SortIcon direction={direction} active={isActive} />
                      </button>
                    </span>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={rowKey(row)}
              className="group/row text-sm font-semibold text-text-main hover:bg-surface-soft/40 transition-colors "
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-5 py-4 whitespace-nowrap border-b border-border-main/50 first:pl-6 last:pr-6 ${column.className ?? ""}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
