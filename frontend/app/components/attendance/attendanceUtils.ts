export type AttendanceStatusFilter = "all" | "present" | "absent" | "late";

export type FilterOption = {
  value: string;
  label: string;
};

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const parsed = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(parsed.getTime())) return key;
  return parsed.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function formatAttendanceDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function uniqueMonthOptions(dates: string[]): FilterOption[] {
  const keys = [...new Set(dates.map(monthKey).filter(Boolean))].sort().reverse();
  return keys.map((value) => ({ value, label: monthLabel(value) }));
}

export function uniqueDateOptions(dates: string[], month = "all"): FilterOption[] {
  const filtered =
    month === "all" ? dates : dates.filter((date) => monthKey(date) === month);
  return [...new Set(filtered)].sort().reverse().map((value) => ({
    value,
    label: formatAttendanceDate(value),
  }));
}

export function matchesMonth(date: string, month: string) {
  return month === "all" || monthKey(date) === month;
}

export function matchesDate(date: string, selectedDate: string) {
  return selectedDate === "all" || date === selectedDate;
}

export function matchesCountStatus(
  counts: { present_count: number; absent_count: number; late_count: number },
  status: AttendanceStatusFilter,
) {
  if (status === "all") return true;
  if (status === "present") return counts.present_count > 0;
  if (status === "absent") return counts.absent_count > 0;
  return counts.late_count > 0;
}
