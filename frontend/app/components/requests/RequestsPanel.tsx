import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import {
  Check,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Inbox,
  Loader2,
  MoreVertical,
  School,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { getAccessToken } from "../../store/auth";
import {
  deleteInboxRequest,
  fetchInboxRequests,
  type LeaveRequest,
  type RequesterRole,
} from "../../store/requests";
import { usePendingRequestCounts } from "../../hooks/usePendingRequestCounts";
import { fetchMyTeacherAssignment } from "../../store/teacherAssignments";
import type { UserPayload } from "../../store/user";
import { toast } from "../toast/toast";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import PermissionGuard from "../auth/PermissionGuard";
import AttendanceKpiCards from "../attendance/AttendanceKpiCards";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import RequestViewModal from "../modals/requests/RequestViewModal";
import ReviewRequestModal from "../modals/requests/ReviewRequestModal";
import {
  formatPendingCount,
  formatRequestDate,
  initials,
  statusLabel,
  statusStyles,
  type RequestStatusFilter,
} from "./requestUtils";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button as UiButton } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];
const SELECT_TRIGGER_CLASS =
  "h-10.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer";

interface RequestsContext {
  user: UserPayload;
}

export default function RequestsPanel() {
  const { user } = useOutletContext<RequestsContext>();
  const isAdmin = user.role === "admin";
  const isTeacher = user.role === "teacher";

  const [tab, setTab] = useState<RequesterRole>("student");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const pendingCounts = usePendingRequestCounts();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assignmentLabel, setAssignmentLabel] = useState("");
  const [unassignedMessage, setUnassignedMessage] = useState("");
  const [viewing, setViewing] = useState<LeaveRequest | null>(null);
  const [reviewing, setReviewing] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [deleting, setDeleting] = useState<LeaveRequest | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const loadRequests = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    if (isTeacher) {
      const assignment = await fetchMyTeacherAssignment(token);
      if (assignment.kind === "unassigned") {
        setUnassignedMessage(assignment.message);
        setAssignmentLabel("");
        setRequests([]);
        return;
      }
      if (assignment.kind === "assignment") {
        setAssignmentLabel(
          `${assignment.assignment.class_name} / ${assignment.assignment.section_name}`,
        );
        setUnassignedMessage("");
      }
      const rows = await fetchInboxRequests(token, "student");
      setRequests(rows);
      return;
    }

    setUnassignedMessage("");
    setAssignmentLabel("");
    const rows = await fetchInboxRequests(token, isAdmin ? tab : undefined);
    setRequests(rows);
  }, [isAdmin, isTeacher, tab]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        await loadRequests();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load requests.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [loadRequests]);

  const filtered = useMemo(
    () => requests.filter((row) => statusFilter === "all" || row.status === statusFilter),
    [requests, statusFilter],
  );

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    filtered,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize, requests.length, tab]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const totals = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((row) => row.status === "pending").length,
      approved: requests.filter((row) => row.status === "approved").length,
      rejected: requests.filter((row) => row.status === "rejected").length,
    }),
    [requests],
  );

  const kpiCards = [
    { key: "all", title: "Total", value: totals.total, color: "#6366f1", icon: Inbox },
    { key: "pending", title: "Pending", value: totals.pending, color: "#f59e0b", icon: Clock },
    { key: "approved", title: "Approved", value: totals.approved, color: "#10b981", icon: CheckCircle2 },
    { key: "rejected", title: "Rejected", value: totals.rejected, color: "#ef4444", icon: XCircle },
  ];

  const handleDelete = async () => {
    if (!deleting) return;
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }
    setDeletingBusy(true);
    try {
      await deleteInboxRequest(token, deleting.id);
      setDeleting(null);
      toast.success("Request deleted.");
      await loadRequests();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete request.");
    } finally {
      setDeletingBusy(false);
    }
  };

  const columns = useMemo<TableColumn<LeaveRequest>[]>(
    () => [
      {
        key: "requester_name",
        header: tab === "teacher" ? "Teacher" : "Student",
        sortable: true,
        sortValue: (row) => row.requester_name,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-sm font-bold text-brand">
              {initials(row.requester_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-main">{row.requester_name}</p>
              <p className="truncate text-xs text-text-muted">{row.requester_email || "Leave request"}</p>
            </div>
          </div>
        ),
      },
      {
        key: "class_name",
        header: "Class",
        sortable: true,
        sortValue: (row) => row.class_name ?? "",
        render: (row) => (
          <span className="font-medium text-text-main">
            {row.class_name ? `${row.class_name}${row.section_name ? ` / ${row.section_name}` : ""}` : "—"}
          </span>
        ),
      },
      {
        key: "from_date",
        header: "From",
        sortable: true,
        sortValue: (row) => row.from_date,
        render: (row) => (
          <span className="font-medium text-text-main">{formatRequestDate(row.from_date)}</span>
        ),
      },
      {
        key: "to_date",
        header: "To",
        sortable: true,
        sortValue: (row) => row.to_date,
        render: (row) => (
          <span className="font-medium text-text-main">{formatRequestDate(row.to_date)}</span>
        ),
      },
      {
        key: "days",
        header: "Days",
        sortable: true,
        sortValue: (row) => row.days,
        render: (row) => <span className="font-medium text-text-main">{row.days}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        sortValue: (row) => row.status,
        render: (row) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles(row.status)}`}
          >
            {statusLabel(row.status)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
                  aria-label="Request actions"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setViewing(row)}>
                <Eye className="size-4" />
                View
              </DropdownMenuItem>
              {row.can_review ? (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      setReviewing(row);
                      setReviewAction("approved");
                    }}
                  >
                    <Check className="size-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => {
                      setReviewing(row);
                      setReviewAction("rejected");
                    }}
                  >
                    <X className="size-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              ) : null}
              {row.can_delete ? (
                <PermissionGuard permission="requests.delete">
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => setDeleting(row)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </PermissionGuard>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [tab],
  );

  const showingLabel =
    filtered.length === 0
      ? "No leave requests"
      : `Showing ${startIndex}-${endIndex} of ${filtered.length} requests`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-main">Requests</h2>
        <p className="mt-1 text-sm text-text-muted">
          {isTeacher
            ? assignmentLabel
              ? `Leave requests from students in ${assignmentLabel}.`
              : "Leave requests from students in your assigned class."
            : "Review leave requests submitted by students and teachers."}
        </p>
      </div>

      {isAdmin ? (
        <div className="flex w-fit rounded-xl border border-border-main bg-app-bg p-1">
          <button
            type="button"
            onClick={() => setTab("student")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "student"
                ? "bg-panel-bg text-text-main shadow-sm ring-1 ring-border-main"
                : "text-text-muted hover:bg-panel-bg/50 hover:text-text-main"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Student Requests
            {formatPendingCount(pendingCounts.student) ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {formatPendingCount(pendingCounts.student)}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setTab("teacher")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "teacher"
                ? "bg-panel-bg text-text-main shadow-sm ring-1 ring-border-main"
                : "text-text-muted hover:bg-panel-bg/50 hover:text-text-main"
            }`}
          >
            <Users className="h-4 w-4" />
            Teacher Requests
            {formatPendingCount(pendingCounts.teacher) ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {formatPendingCount(pendingCounts.teacher)}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}

      {isTeacher && assignmentLabel ? (
        <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
          <School className="h-4 w-4 text-brand" />
          Assigned class: <span className="text-text-main">{assignmentLabel}</span>
        </div>
      ) : null}

      <AttendanceKpiCards
        cards={kpiCards}
        selectedKey={statusFilter}
        onSelect={(key) => setStatusFilter(key as RequestStatusFilter)}
      />

      <div className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-text-main">
              {isAdmin ? (tab === "teacher" ? "Teacher Requests" : "Student Requests") : "Student Requests"}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">{showingLabel}</p>
          </div>
          <div className="w-full sm:w-44">
            <div className="mb-2 flex items-center">
              <Label className="block text-sm font-medium leading-5 text-text-main">Status</Label>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: string | null) =>
                setStatusFilter((value as RequestStatusFilter) ?? "all")
              }
              items={[
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            >
              <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent
                align="start"
                className="rounded-md border-border-main bg-panel-bg text-text-main"
              >
                <SelectItem value="all" className="cursor-pointer">
                  All statuses
                </SelectItem>
                <SelectItem value="pending" className="cursor-pointer">
                  Pending
                </SelectItem>
                <SelectItem value="approved" className="cursor-pointer">
                  Approved
                </SelectItem>
                <SelectItem value="rejected" className="cursor-pointer">
                  Rejected
                </SelectItem>
                <SelectItem value="cancelled" className="cursor-pointer">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-muted">Loading requests...</p>
          </div>
        ) : unassignedMessage ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-brand-soft text-brand">
              <School className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">No class assigned</h4>
            <p className="mx-auto max-w-sm text-sm text-text-muted">{unassignedMessage}</p>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <Table columns={columns} data={paginatedItems} rowKey={(row) => row.id} />
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
              <Inbox className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {requests.length === 0 ? "No Requests Yet" : "No Matching Requests"}
            </h4>
            <p className="mx-auto max-w-sm text-sm text-text-muted">
              {requests.length === 0
                ? isTeacher
                  ? "When students in your class submit leave requests, they will appear here."
                  : "Leave requests will appear here after students or teachers submit them."
                : "Try a different status filter."}
            </p>
          </div>
        )}
      </div>

      <RequestViewModal
        open={Boolean(viewing)}
        request={viewing}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
      <ReviewRequestModal
        open={Boolean(reviewing)}
        request={reviewing}
        action={reviewAction}
        onOpenChange={(open) => {
          if (!open) {
            setReviewing(null);
            setReviewAction(null);
          }
        }}
        onSuccess={loadRequests}
      />
      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="Delete leave request"
        description="This leave request will be permanently removed."
        loading={deletingBusy}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
