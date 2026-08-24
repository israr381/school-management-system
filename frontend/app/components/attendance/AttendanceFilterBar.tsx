import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { AttendanceStatusFilter, FilterOption } from "./attendanceUtils";

const SELECT_TRIGGER_CLASS =
  "h-10.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer";

const STATUS_OPTIONS: FilterOption[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "leave", label: "Leave" },
];

type FilterFieldProps = {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  allLabel: string;
  onChange: (value: string) => void;
};

function FilterField({ id, label, value, options, allLabel, onChange }: FilterFieldProps) {
  return (
    <div className="w-full sm:w-44">
      <div className="mb-2 flex items-center">
        <Label htmlFor={id} className="block text-sm font-medium leading-5 text-text-main">
          {label}
        </Label>
      </div>
      <Select
        id={id}
        name={id}
        value={value}
        onValueChange={(next: string | null) => onChange(next ?? "all")}
        items={[{ value: "all", label: allLabel }, ...options]}
      >
        <SelectTrigger className={SELECT_TRIGGER_CLASS}>
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="rounded-md border-border-main bg-panel-bg text-text-main"
        >
          <SelectItem value="all" className="cursor-pointer">
            {allLabel}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type AttendanceFilterBarProps = {
  title: string;
  showingLabel: string;
  month: string;
  months: FilterOption[];
  onMonthChange: (value: string) => void;
  date: string;
  dates: FilterOption[];
  onDateChange: (value: string) => void;
  status: AttendanceStatusFilter;
  onStatusChange: (value: AttendanceStatusFilter) => void;
  classId?: string;
  classOptions?: FilterOption[];
  onClassChange?: (value: string) => void;
  sectionId?: string;
  sectionOptions?: FilterOption[];
  onSectionChange?: (value: string) => void;
};

export default function AttendanceFilterBar({
  title,
  showingLabel,
  month,
  months,
  onMonthChange,
  date,
  dates,
  onDateChange,
  status,
  onStatusChange,
  classId,
  classOptions,
  onClassChange,
  sectionId,
  sectionOptions,
  onSectionChange,
}: AttendanceFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-[15px] font-semibold text-text-main">{title}</h2>
        <p className="mt-0.5 text-xs text-text-muted">{showingLabel}</p>
      </div>
      <div className="flex w-full flex-wrap gap-3 sm:items-end lg:w-auto">
        <FilterField
          id="attendance_month_filter"
          label="Month"
          value={month}
          options={months}
          allLabel="All months"
          onChange={onMonthChange}
        />
        <FilterField
          id="attendance_date_filter"
          label="Date"
          value={date}
          options={dates}
          allLabel="All dates"
          onChange={onDateChange}
        />
        {classOptions && onClassChange ? (
          <FilterField
            id="attendance_class_filter"
            label="Class"
            value={classId ?? "all"}
            options={classOptions}
            allLabel="All classes"
            onChange={onClassChange}
          />
        ) : null}
        {sectionOptions && onSectionChange ? (
          <FilterField
            id="attendance_section_filter"
            label="Section"
            value={sectionId ?? "all"}
            options={sectionOptions}
            allLabel="All sections"
            onChange={onSectionChange}
          />
        ) : null}
        <FilterField
          id="attendance_status_filter"
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          allLabel="All statuses"
          onChange={(value) => onStatusChange(value as AttendanceStatusFilter)}
        />
      </div>
    </div>
  );
}
