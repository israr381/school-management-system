import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Clock, Loader2, Pencil, Plus, Trash2, UserCheck, Users, UserX } from "lucide-react";
import { getAccessToken } from "../../store/auth";
import { fetchClasses, fetchSections, type SchoolClass, type SchoolSection } from "../../store/classes";
import { fetchMyTeacherAssignment } from "../../store/teacherAssignments";
import {
  deleteStudentAttendance,
  fetchStudentAttendanceHistory,
  type StudentAttendanceSummary,
} from "../../store/attendance";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import TakeStudentAttendanceModal from "../modals/attendance/TakeStudentAttendanceModal";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import { Button as UiButton } from "~/components/ui/button";
import PermissionGuard from "../auth/PermissionGuard";
import AttendanceFilterBar from "./AttendanceFilterBar";
import AttendanceKpiCards from "./AttendanceKpiCards";
import {
  formatAttendanceDate,
  matchesCountStatus,
  matchesDate,
  matchesMonth,
  uniqueDateOptions,
  uniqueMonthOptions,
  type AttendanceStatusFilter,
} from "./attendanceUtils";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

export default function StudentAttendancePanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [locked, setLocked] = useState(false);
  const [defaultClassId, setDefaultClassId] = useState("");
  const [defaultSectionId, setDefaultSectionId] = useState("");
  const [defaultClassName, setDefaultClassName] = useState("");
  const [defaultSectionName, setDefaultSectionName] = useState("");
  const [history, setHistory] = useState<StudentAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentAttendanceSummary | null>(null);
  const [deleting, setDeleting] = useState<StudentAttendanceSummary | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
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

    const data = await fetchStudentAttendanceHistory(token);
    setHistory(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const assignment = await fetchMyTeacherAssignment(token);
        if (cancelled) return;
        if (assignment.kind === "assignment") {
          setLocked(true);
          setDefaultClassId(String(assignment.assignment.class_id));
          setDefaultSectionId(String(assignment.assignment.section_id));
          setDefaultClassName(assignment.assignment.class_name);
          setDefaultSectionName(assignment.assignment.section_name);
        } else if (assignment.kind === "unassigned") {
          setLocked(true);
        } else {
          const [classData, sectionData] = await Promise.all([
            fetchClasses(token),
            fetchSections(token),
          ]);
          if (cancelled) return;
          setClasses(classData);
          setSections(sectionData);
        }
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
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of history) {
      map.set(String(row.class_id), row.class_name);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [history]);
  const sectionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of history) {
      if (classFilter !== "all" && String(row.class_id) !== classFilter) continue;
      map.set(String(row.section_id), row.section_name);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [history, classFilter]);

  const scopedHistory = useMemo(
    () =>
      history.filter((row) => {
        if (!matchesMonth(row.attendance_date, monthFilter)) return false;
        if (!matchesDate(row.attendance_date, dateFilter)) return false;
        if (classFilter !== "all" && String(row.class_id) !== classFilter) return false;
        if (sectionFilter !== "all" && String(row.section_id) !== sectionFilter) return false;
        return true;
      }),
    [history, monthFilter, dateFilter, classFilter, sectionFilter],
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
  }, [pageSize, monthFilter, dateFilter, classFilter, sectionFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totals = useMemo(
    () =>
      scopedHistory.reduce(
        (acc, row) => ({
          students: acc.students + row.total_students,
          present: acc.present + row.present_count,
          absent: acc.absent + row.absent_count,
          late: acc.late + row.late_count,
        }),
        { students: 0, present: 0, absent: 0, late: 0 },
      ),
    [scopedHistory],
  );

  const kpiCards = [
    { key: "all", title: "Total Students", value: totals.students, color: "#6366f1", icon: Users },
    { key: "present", title: "Present", value: totals.present, color: "#10b981", icon: UserCheck },
    { key: "absent", title: "Absent", value: totals.absent, color: "#ef4444", icon: UserX },
    { key: "late", title: "Late", value: totals.late, color: "#f97316", icon: Clock },
  ];

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(null);
  };

  const openAdd = () => {
    if (locked && !defaultClassId) {
      toast.error("Ask an admin to assign you to a class first.");
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: StudentAttendanceSummary) => {
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
      await deleteStudentAttendance(token, {
        attendance_date: deleting.attendance_date,
        class_id: deleting.class_id,
        section_id: deleting.section_id,
      });
      setDeleting(null);
      toast.success(
        `Attendance for ${deleting.class_name}-${deleting.section_name} on ${deleting.attendance_date} was deleted.`,
      );
      await loadHistory();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete attendance.");
    } finally {
      setDeletingBusy(false);
    }
  };

  const columns = useMemo<TableColumn<StudentAttendanceSummary>[]>(
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
        key: "class_name",
        header: "Class",
        sortable: true,
        sortValue: (row) => row.class_name,
        render: (row) => <span className="font-semibold text-text-main">{row.class_name}</span>,
      },
      {
        key: "section_name",
        header: "Section",
        sortable: true,
        sortValue: (row) => row.section_name,
        render: (row) => <span className="font-semibold text-text-main">{row.section_name}</span>,
      },
      {
        key: "total_students",
        header: "Total Students",
        sortable: true,
        sortValue: (row) => row.total_students,
        render: (row) => <span className="font-semibold text-text-main">{row.total_students}</span>,
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
            <PermissionGuard permission="student_attendance.update">
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
            <PermissionGuard permissions={["student_attendance.delete", "student_attendance.update"]}>
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
    <div className="mx-auto max-w-350 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">Student Attendance</h2>
          <p className="mt-1 text-sm text-text-muted">
            {locked
              ? "Take attendance for your assigned class, then review the saved records below."
              : "Take attendance in a modal, then review date, class, section, and totals below."}
          </p>
        </div>
        <PermissionGuard permissions={["student_attendance.take", "student_attendance.update"]}>
          <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Take Attendance
          </Button>
        </PermissionGuard>
      </div>

      <AttendanceKpiCards
        cards={kpiCards}
        selectedKey={statusFilter}
        onSelect={(key) => setStatusFilter(key as AttendanceStatusFilter)}
      />

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
          classId={locked ? undefined : classFilter}
          classOptions={locked ? undefined : classOptions}
          onClassChange={
            locked
              ? undefined
              : (value) => {
                  setClassFilter(value);
                  setSectionFilter("all");
                }
          }
          sectionId={locked ? undefined : sectionFilter}
          sectionOptions={locked ? undefined : sectionOptions}
          onSectionChange={locked ? undefined : setSectionFilter}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-muted">Loading attendance...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <>
            <Table
              columns={columns}
              data={paginatedItems}
              rowKey={(row) => `${row.attendance_date}-${row.class_id}-${row.section_id}`}
            />
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
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {history.length === 0 ? "No Attendance Yet" : "No Matching Records"}
            </h4>
            <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
              {history.length === 0
                ? "Open Take Attendance to mark students, then saved records will appear here."
                : "Try a different month, date, class, or status filter."}
            </p>
            {history.length === 0 ? (
              <PermissionGuard permissions={["student_attendance.take", "student_attendance.update"]}>
                <Button type="button" onClick={openAdd} className="px-5 py-2.5 text-sm">
                  <Plus className="h-4 w-4" />
                  Take Attendance
                </Button>
              </PermissionGuard>
            ) : null}
          </div>
        )}
      </div>

      <TakeStudentAttendanceModal
        open={formOpen}
        locked={locked}
        defaultClassId={defaultClassId}
        defaultSectionId={defaultSectionId}
        defaultClassName={defaultClassName}
        defaultSectionName={defaultSectionName}
        classes={classes}
        sections={sections}
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
            ? `Are you sure you want to delete attendance for ${deleting.class_name}-${deleting.section_name} on ${deleting.attendance_date}? This cannot be undone.`
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
