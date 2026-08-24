import Button from "../../button/Button";
import type { LeaveRequest } from "../../../store/requests";
import { formatRequestDate, statusLabel, statusStyles } from "../../requests/requestUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface RequestViewModalProps {
  open: boolean;
  request: LeaveRequest | null;
  onOpenChange: (open: boolean) => void;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-main bg-surface-soft px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-main">{value}</p>
    </div>
  );
}

export default function RequestViewModal({ open, request, onOpenChange }: RequestViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-panel-bg text-text-main sm:max-w-lg p-0 gap-0">
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            Leave Request
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Review the leave details and current status.
          </DialogDescription>
        </DialogHeader>

        {request ? (
          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-text-main">{request.requester_name}</p>
                <p className="text-xs text-text-muted">
                  {request.requester_role === "teacher" ? "Teacher" : "Student"}
                  {request.class_name
                    ? ` · ${request.class_name}${request.section_name ? ` / ${request.section_name}` : ""}`
                    : ""}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles(request.status)}`}
              >
                {statusLabel(request.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Type" value="Leave" />
              <Detail label="Days" value={String(request.days)} />
              <Detail label="From" value={formatRequestDate(request.from_date)} />
              <Detail label="To" value={formatRequestDate(request.to_date)} />
            </div>

            <div className="rounded-xl border border-border-main bg-surface-soft px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Reason</p>
              <p className="mt-1 text-sm leading-6 text-text-main">{request.reason}</p>
            </div>

            {request.review_note ? (
              <div className="rounded-xl border border-border-main bg-surface-soft px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Review note
                </p>
                <p className="mt-1 text-sm leading-6 text-text-main">{request.review_note}</p>
                {request.reviewer_name ? (
                  <p className="mt-2 text-xs text-text-muted">By {request.reviewer_name}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border-main bg-panel-bg px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-5 py-2.5 text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
