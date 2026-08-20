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

export type AttendanceCountRow = {
  attendance_date: string;
  total: number;
  present: number;
  late: number;
};

function localISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeekMonday(date: Date) {
  const start = new Date(date);
  const weekday = start.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function attendanceRate(rows: AttendanceCountRow[]) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  if (total <= 0) return 0;
  const attended = rows.reduce((sum, row) => sum + row.present + row.late, 0);
  return Math.round((attended / total) * 100);
}

export function attendanceOverview(rows: AttendanceCountRow[]) {
  const now = new Date();
  const today = localISODate(now);
  const month = today.slice(0, 7);
  const weekStart = localISODate(startOfWeekMonday(now));
  const weekEndDate = startOfWeekMonday(now);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = localISODate(weekEndDate);

  const todayRows = rows.filter((row) => row.attendance_date === today);
  const weekRows = rows.filter(
    (row) => row.attendance_date >= weekStart && row.attendance_date <= weekEnd,
  );
  const monthRows = rows.filter((row) => row.attendance_date.startsWith(month));

  return {
    todayRate: attendanceRate(todayRows),
    weekRate: attendanceRate(weekRows),
    monthRate: attendanceRate(monthRows),
    classesThisMonth: monthRows.length,
  };
}
