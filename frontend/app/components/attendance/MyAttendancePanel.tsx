import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Clock, Loader2, UserCheck, UserX } from "lucide-react";
import { getAccessToken } from "../../store/auth";
import { fetchMyAttendance, type MyAttendance, type MyAttendanceRecord } from "../../store/attendance";
import { toast } from "../toast/toast";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import AttendanceFilterBar from "./AttendanceFilterBar";
import AttendanceKpiCards from "./AttendanceKpiCards";
import {
  formatAttendanceDate,
  matchesDate,
  matchesMonth,
  uniqueDateOptions,
  uniqueMonthOptions,
  type AttendanceStatusFilter,
} from "./attendanceUtils";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

function statusStyles(status: string) {
  if (status === "present") return "bg-success-bg text-success border-success-border";
  if (status === "absent") return "bg-danger-bg text-danger border-danger-border";
  return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300";
}

export default function MyAttendancePanel() {
  const [data, setData] = useState<MyAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const result = await fetchMyAttendance(token);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load your attendance.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const records = data?.records ?? [];
  const monthOptions = useMemo(
    () => uniqueMonthOptions(records.map((row) => row.attendance_date)),
    [records],
  );
  const dateOptions = useMemo(
    () => uniqueDateOptions(records.map((row) => row.attendance_date), monthFilter),
    [records, monthFilter],
  );

  const scopedRecords = useMemo(
    () =>
      records.filter((row) => {
        if (!matchesMonth(row.attendance_date, monthFilter)) return false;
        if (!matchesDate(row.attendance_date, dateFilter)) return false;
        return true;
      }),
    [records, monthFilter, dateFilter],
  );

  const filteredRecords = useMemo(
    () =>
      scopedRecords.filter((row) => statusFilter === "all" || row.status === statusFilter),
    [scopedRecords, statusFilter],
  );

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    filteredRecords,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, monthFilter, dateFilter, statusFilter, records.length]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totals = useMemo(
    () =>
      scopedRecords.reduce(
        (acc, row) => ({
          total: acc.total + 1,
          present: acc.present + (row.status === "present" ? 1 : 0),
          absent: acc.absent + (row.status === "absent" ? 1 : 0),
          late: acc.late + (row.status === "late" ? 1 : 0),
        }),
        { total: 0, present: 0, absent: 0, late: 0 },
      ),
    [scopedRecords],
  );

  const kpiCards = [
    { key: "all", title: "Total Days", value: totals.total, color: "#6366f1", icon: CalendarCheck },
    { key: "present", title: "Present", value: totals.present, color: "#10b981", icon: UserCheck },
    { key: "absent", title: "Absent", value: totals.absent, color: "#ef4444", icon: UserX },
    { key: "late", title: "Late", value: totals.late, color: "#f97316", icon: Clock },
  ];

  const columns = useMemo<TableColumn<MyAttendanceRecord>[]>(
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
        key: "status",
        header: "Status",
        sortable: true,
        sortValue: (row) => row.status,
        render: (row) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles(row.status)}`}
          >
            {row.status}
          </span>
        ),
      },
      ...(data?.person_type === "student"
        ? [
            {
              key: "class_name",
              header: "Class",
              sortable: true,
              sortValue: (row: MyAttendanceRecord) => row.class_name ?? "",
              render: (row: MyAttendanceRecord) => (
                <span className="font-medium text-text-main">{row.class_name || "—"}</span>
              ),
            },
            {
              key: "section_name",
              header: "Section",
              sortable: true,
              sortValue: (row: MyAttendanceRecord) => row.section_name ?? "",
              render: (row: MyAttendanceRecord) => (
                <span className="font-medium text-text-main">{row.section_name || "—"}</span>
              ),
            },
          ]
        : []),
    ],
    [data?.person_type],
  );

  const showingLabel =
    filteredRecords.length === 0
      ? "No attendance records"
      : `Showing ${startIndex}-${endIndex} of ${filteredRecords.length} days`;

  return (
    <div className="mx-auto max-w-350 space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-main">My Attendance</h2>
        <p className="mt-1 text-sm text-text-muted">
          {data?.person_type === "teacher"
            ? "Your teacher attendance history."
            : data?.person_type === "student"
              ? "Your student attendance history."
              : "View your attendance history."}
        </p>
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
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-muted">Loading your attendance...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
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
              <CalendarCheck className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {records.length === 0 ? "No Attendance Yet" : "No Matching Records"}
            </h4>
            <p className="mx-auto max-w-sm text-sm text-text-muted">
              {records.length === 0
                ? "Your attendance will appear here after it has been taken."
                : "Try a different month, date, or status filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
