import type { AttendanceStatus } from "../../store/attendance";
import { cn } from "../../lib/utils";

const OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  {
    value: "present",
    label: "Present",
    activeClass: "border-success-border bg-success-bg text-success",
  },
  {
    value: "absent",
    label: "Absent",
    activeClass: "border-danger-border bg-danger-bg text-danger",
  },
  {
    value: "late",
    label: "Late",
    activeClass: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    value: "leave",
    label: "Leave",
    activeClass: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300",
  },
];

interface AttendanceStatusPickerProps {
  value: AttendanceStatus;
  disabled?: boolean;
  onChange: (value: AttendanceStatus) => void;
}

export default function AttendanceStatusPicker({
  value,
  disabled,
  onChange,
}: AttendanceStatusPickerProps) {
  return (
    <div className="inline-flex flex-wrap gap-1.5">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
            value === option.value
              ? option.activeClass
              : "border-border-main bg-panel-bg text-text-muted hover:bg-surface-soft hover:text-text-main",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
