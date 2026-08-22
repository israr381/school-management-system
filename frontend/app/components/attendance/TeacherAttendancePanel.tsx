import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, ClipboardCheck, Loader2, Pencil, Plus, School, Trash2, UserCheck } from "lucide-react";
import { getAccessToken } from "../../store/auth";
import {
  deleteTeacherAttendance,
  fetchTeacherAttendanceHistory,
  type TeacherAttendanceSummary,
} from "../../store/attendance";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import TakeTeacherAttendanceModal from "../modals/attendance/TakeTeacherAttendanceModal";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import { Button as UiButton } from "~/components/ui/button";
import PermissionGuard from "../auth/PermissionGuard";
import AttendanceFilterBar from "./AttendanceFilterBar";
import AttendanceKpiCards from "./AttendanceKpiCards";
import {
  attendanceOverview,
  formatAttendanceDate,
  matchesCountStatus,
  matchesDate,
  matchesMonth,
  uniqueDateOptions,
  uniqueMonthOptions,
  type AttendanceStatusFilter,
} from "./attendanceUtils";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

export default function TeacherAttendancePanel() {
  const [history, setHistory] = useState<TeacherAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherAttendanceSummary | null>(null);
  const [deleting, setDeleting] = useState<TeacherAttendanceSummary | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadHistory = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }
    const data = await fetchTeacherAttendanceHistory(token);
    setHistory(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadHistory();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load attendance.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadHistory]);

  const monthOptions = useMemo(
    () => uniqueMonthOptions(history.map((row) => row.attendance_date)),
    [history],
  );
  const dateOptions = useMemo(
    () => uniqueDateOptions(history.map((row) => row.attendance_date), monthFilter),
    [history, monthFilter],
  );

  const scopedHistory = useMemo(
    () =>
      history.filter((row) => {
        if (!matchesMonth(row.attendance_date, monthFilter)) return false;
        if (!matchesDate(row.attendance_date, dateFilter)) return false;
        return true;
      }),
    [history, monthFilter, dateFilter],
  );

  const filteredHistory = useMemo(
    () => scopedHistory.filter((row) => matchesCountStatus(row, statusFilter)),
    [scopedHistory, statusFilter],
  );

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    filteredHistory,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, monthFilter, dateFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const overview = useMemo(
    () =>
      attendanceOverview(
        history.map((row) => ({
          attendance_date: row.attendance_date,
          total: row.total_teachers,
          present: row.present_count,
          late: row.late_count,
        })),
      ),
    [history],
  );

  const kpiCards = [
    {
      key: "today",
      title: "Today's Attendance",
      value: `${overview.todayRate}%`,
      color: "#10b981",
      icon: CalendarCheck,
    },
    {
      key: "week",
      title: "This Week",
      value: `${overview.weekRate}%`,
      color: "#3b82f6",
      icon: CalendarDays,
    },
    {
      key: "month",
      title: "This Month",
      value: `${overview.monthRate}%`,
      color: "#6366f1",
      icon: ClipboardCheck,
    },
    {
      key: "classes",
      title: "Total Classes",
      value: overview.classesThisMonth,
      color: "#f97316",
      icon: School,
    },
  ];

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(null);
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: TeacherAttendanceSummary) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setDeletingBusy(true);
    try {
      await deleteTeacherAttendance(token, deleting.attendance_date);
      setDeleting(null);
      toast.success(`Attendance for ${deleting.attendance_date} was deleted.`);
      await loadHistory();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete attendance.");
    } finally {
      setDeletingBusy(false);
    }
  };

  const columns = useMemo<TableColumn<TeacherAttendanceSummary>[]>(
    () => [
      {
        key: "attendance_date",
        header: "Date",
        sortable: true,
        sortValue: (row) => row.attendance_date,
        render: (row) => (
          <span className="font-semibold text-text-main">{formatAttendanceDate(row.attendance_date)}</span>
        ),
      },
      {
        key: "total_teachers",
        header: "Total Teachers",
        sortable: true,
        sortValue: (row) => row.total_teachers,
        render: (row) => <span className="font-semibold text-text-main">{row.total_teachers}</span>,
      },
      {
        key: "present_count",
        header: "Present",
        sortable: true,
        sortValue: (row) => row.present_count,
        render: (row) => <span className="font-semibold text-success">{row.present_count}</span>,
      },
      {
        key: "absent_count",
        header: "Absent",
        sortable: true,
        sortValue: (row) => row.absent_count,
        render: (row) => <span className="font-semibold text-danger">{row.absent_count}</span>,
      },
      {
        key: "late_count",
        header: "Late",
        sortable: true,
        sortValue: (row) => row.late_count,
        render: (row) => <span className="font-semibold text-amber-600 dark:text-amber-300">{row.late_count}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <div className="flex justify-end gap-1">
            <PermissionGuard permission="teacher_attendance.update">
              <UiButton
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
                aria-label={`Edit attendance for ${row.attendance_date}`}
                onClick={() => openEdit(row)}
              >
                <Pencil className="size-4" />
              </UiButton>
            </PermissionGuard>
            <PermissionGuard permission="teacher_attendance.delete">
              <UiButton
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-danger-hover-bg hover:text-danger"
                aria-label={`Delete attendance for ${row.attendance_date}`}
                onClick={() => setDeleting(row)}
              >
                <Trash2 className="size-4" />
              </UiButton>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [],
  );

  const showingLabel =
    filteredHistory.length === 0
      ? "No attendance records"
      : `Showing ${startIndex}-${endIndex} of ${filteredHistory.length} records`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">Teacher Attendance</h2>
          <p className="mt-1 text-sm text-text-muted">
            Take attendance in a modal, then review date, totals, present, and absent below.
          </p>
        </div>
        <PermissionGuard permissions={["teacher_attendance.take", "teacher_attendance.update"]}>
          <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Take Attendance
          </Button>
        </PermissionGuard>
      </div>

      <AttendanceKpiCards cards={kpiCards} />

      <div className="overflow-hidden">
        <AttendanceFilterBar
          title="Attendance History"
          showingLabel={showingLabel}
          month={monthFilter}
          months={monthOptions}
          onMonthChange={(value) => {
            setMonthFilter(value);
            setDateFilter("all");
          }}
          date={dateFilter}
          dates={dateOptions}
          onDateChange={setDateFilter}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-muted">Loading attendance...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <>
            <Table columns={columns} data={paginatedItems} rowKey={(row) => row.attendance_date} />
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-brand-soft text-brand">
              <UserCheck className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {history.length === 0 ? "No Attendance Yet" : "No Matching Records"}
            </h4>
            <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
              {history.length === 0
                ? "Open Take Attendance to mark teachers, then saved records will appear here."
                : "Try a different month, date, or status filter."}
            </p>
            {history.length === 0 ? (
              <PermissionGuard permissions={["teacher_attendance.take", "teacher_attendance.update"]}>
                <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
                  <Plus className="h-4 w-4" />
                  Take Attendance
                </Button>
              </PermissionGuard>
            ) : null}
          </div>
        )}
      </div>

      <TakeTeacherAttendanceModal
        open={formOpen}
        editing={editing}
        onOpenChange={handleFormOpenChange}
        onSuccess={async () => {
          await loadHistory();
          toast.success(editing ? "Attendance updated." : "Attendance saved.");
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="Delete attendance?"
        description={
          deleting
            ? `Are you sure you want to delete teacher attendance for ${deleting.attendance_date}? This cannot be undone.`
            : ""
        }
        loading={deletingBusy}
        onOpenChange={(open) => {
          if (!open && !deletingBusy) setDeleting(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
