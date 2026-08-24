import type { RequestStatus } from "../../store/requests";
import { formatAttendanceDate } from "../attendance/attendanceUtils";

export type RequestStatusFilter = "all" | RequestStatus;

export function formatRequestDate(value: string) {
  return formatAttendanceDate(value.slice(0, 10));
}

export function statusStyles(status: RequestStatus) {
  if (status === "approved") return "bg-success-bg text-success border-success-border";
  if (status === "rejected") return "bg-danger-bg text-danger border-danger-border";
  if (status === "cancelled") {
    return "border-border-main bg-surface-soft text-text-muted";
  }
  return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300";
}

export function statusLabel(status: RequestStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatPendingCount(count: number) {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}
