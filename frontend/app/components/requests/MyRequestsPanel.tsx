import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Loader2,
  MoreVertical,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import { getAccessToken } from "../../store/auth";
import { cancelMyRequest, fetchMyRequests, type LeaveRequest } from "../../store/requests";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import PermissionGuard from "../auth/PermissionGuard";
import AttendanceKpiCards from "../attendance/AttendanceKpiCards";
import ConfirmDeleteModal from "../modals/confirm-delete/ConfirmDeleteModal";
import LeaveRequestFormModal from "../modals/requests/LeaveRequestFormModal";
import RequestViewModal from "../modals/requests/RequestViewModal";
import {
  formatRequestDate,
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

export default function MyRequestsPanel() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<LeaveRequest | null>(null);
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);
  const [cancellingBusy, setCancellingBusy] = useState(false);

  const loadRequests = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }
    const rows = await fetchMyRequests(token);
    setRequests(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        await loadRequests();
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load your requests.");
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
  }, [statusFilter, pageSize, requests.length]);

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

  const handleCancel = async () => {
    if (!cancelling) return;
    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }
    setCancellingBusy(true);
    try {
      await cancelMyRequest(token, cancelling.id);
      setCancelling(null);
      toast.success("Leave request cancelled.");
      await loadRequests();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel request.");
    } finally {
      setCancellingBusy(false);
    }
  };

  const columns = useMemo<TableColumn<LeaveRequest>[]>(
    () => [
      {
        key: "request_type",
        header: "Type",
        sortable: true,
        sortValue: (row) => row.request_type,
        render: () => <span className="font-semibold text-text-main">Leave</span>,
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
        key: "reason",
        header: "Reason",
        render: (row) => (
          <span className="line-clamp-2 max-w-xs text-sm text-text-muted">{row.reason}</span>
        ),
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
        key: "created_at",
        header: "Submitted",
        sortable: true,
        sortValue: (row) => row.created_at,
        render: (row) => (
          <span className="font-medium text-text-muted">{formatRequestDate(row.created_at)}</span>
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
              {row.can_cancel ? (
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => setCancelling(row)}
                >
                  <Ban className="size-4" />
                  Cancel
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const showingLabel =
    filtered.length === 0
      ? "No leave requests"
      : `Showing ${startIndex}-${endIndex} of ${filtered.length} requests`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">My Request</h2>
          <p className="mt-1 text-sm text-text-muted">
            Submit a leave request and track its approval status.
          </p>
        </div>
        <PermissionGuard permission="my_requests.create">
          <Button type="button" onClick={() => setFormOpen(true)} className="px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            New Leave Request
          </Button>
        </PermissionGuard>
      </div>

      <AttendanceKpiCards
        cards={kpiCards}
        selectedKey={statusFilter}
        onSelect={(key) => setStatusFilter(key as RequestStatusFilter)}
      />

      <div className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-text-main">Your Requests</h3>
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
            <p className="text-sm font-medium text-text-muted">Loading your requests...</p>
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
              <Send className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {requests.length === 0 ? "No Requests Yet" : "No Matching Requests"}
            </h4>
            <p className="mx-auto max-w-sm text-sm text-text-muted">
              {requests.length === 0
                ? "Create a leave request to get started. Your teacher or admin will review it."
                : "Try a different status filter."}
            </p>
          </div>
        )}
      </div>

      <LeaveRequestFormModal open={formOpen} onOpenChange={setFormOpen} onSuccess={loadRequests} />
      <RequestViewModal
        open={Boolean(viewing)}
        request={viewing}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
      <ConfirmDeleteModal
        open={Boolean(cancelling)}
        title="Cancel leave request"
        description="This pending leave request will be cancelled. You can submit a new one afterwards."
        confirmLabel="Yes, cancel"
        loading={cancellingBusy}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        onConfirm={() => void handleCancel()}
      />
    </div>
  );
}
