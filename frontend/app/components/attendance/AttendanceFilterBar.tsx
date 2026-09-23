import { useState } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
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
    <div className="w-full">
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
          positionerClassName="z-[200]"
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

function isSelectInteraction(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "[data-slot='select-content'], [data-slot='select-item'], [data-slot='select-trigger']",
      ),
    )
  );
}

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
  const [open, setOpen] = useState(false);
  const showClass = Boolean(classOptions && onClassChange);
  const showSection = Boolean(sectionOptions && onSectionChange);
  const activeCount = [
    month !== "all",
    date !== "all",
    status !== "all",
    showClass && (classId ?? "all") !== "all",
    showSection && (sectionId ?? "all") !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    onMonthChange("all");
    onDateChange("all");
    onStatusChange("all");
    onClassChange?.("all");
    onSectionChange?.("all");
  };

  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-[15px] font-semibold text-text-main">{title}</h2>
        <p className="mt-0.5 text-xs text-text-muted">{showingLabel}</p>
      </div>
      <Popover
        open={open}
        modal={false}
        onOpenChange={(nextOpen, eventDetails) => {
          if (!nextOpen && eventDetails.reason === "outside-press" && isSelectInteraction(eventDetails.event.target)) {
            eventDetails.cancel();
            return;
          }
          setOpen(nextOpen);
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-10.5 gap-2 rounded-md border-border-main bg-input-bg px-4 text-sm font-medium text-text-main shadow-none hover:bg-surface-soft dark:bg-input-bg dark:hover:bg-surface-soft focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand"
            />
          }
        >
          <ListFilter className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-72 gap-4 rounded-md border border-border-main bg-panel-bg p-4 text-text-main shadow-md ring-0"
        >
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
          {showClass && classOptions && onClassChange ? (
            <FilterField
              id="attendance_class_filter"
              label="Class"
              value={classId ?? "all"}
              options={classOptions}
              allLabel="All classes"
              onChange={onClassChange}
            />
          ) : null}
          {showSection && sectionOptions && onSectionChange ? (
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
          {activeCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full text-sm text-text-muted hover:bg-surface-soft hover:text-text-main"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
