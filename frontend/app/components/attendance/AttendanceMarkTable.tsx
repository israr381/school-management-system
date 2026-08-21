import { Check } from "lucide-react";
import type { AttendanceStatus } from "../../store/attendance";
import { cn } from "../../lib/utils";

const STATUS_COLUMNS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
];

export type AttendanceMarkRow = {
  id: string | number;
  name: string;
  status: AttendanceStatus;
};

function StatusCheckbox({
  checked,
  disabled,
  label,
  onSelect,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-[5px] border bg-input-bg transition-colors",
        checked ? "border-success" : "border-border-main",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-text-muted",
      )}
    >
      {checked ? <Check className="size-3.5 text-success" strokeWidth={3} /> : null}
    </button>
  );
}

interface AttendanceMarkTableProps {
  rows: AttendanceMarkRow[];
  disabled?: boolean;
  onStatusChange: (id: string | number, status: AttendanceStatus) => void;
}

export default function AttendanceMarkTable({
  rows,
  disabled,
  onStatusChange,
}: AttendanceMarkTableProps) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-border-main">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-surface-soft">
            <th className="border-b border-r border-border-main px-4 py-3 text-left text-sm font-semibold text-text-main">
              Name
            </th>
            {STATUS_COLUMNS.map((column) => (
              <th
                key={column.value}
                className="border-b border-border-main px-3 py-3 text-center text-sm font-semibold text-text-main last:border-r-0 border-r"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-panel-bg">
              <td className="border-b border-r border-border-main px-4 py-3 font-semibold text-text-main">
                {row.name}
              </td>
              {STATUS_COLUMNS.map((column) => (
                <td
                  key={column.value}
                  className="border-b border-border-main px-3 py-3 text-center last:border-r-0 border-r"
                >
                  <StatusCheckbox
                    checked={row.status === column.value}
                    disabled={disabled}
                    label={`Mark ${row.name} ${column.label.toLowerCase()}`}
                    onSelect={() => onStatusChange(row.id, column.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
