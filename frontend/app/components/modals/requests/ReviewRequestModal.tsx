import { useEffect, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import { reviewRequest, type LeaveRequest } from "../../../store/requests";
import Button from "../../button/Button";
import Textarea from "../../input/Textarea";
import { formatRequestDate } from "../../requests/requestUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface ReviewRequestModalProps {
  open: boolean;
  request: LeaveRequest | null;
  action: "approved" | "rejected" | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function ReviewRequestModal({
  open,
  request,
  action,
  onOpenChange,
  onSuccess,
}: ReviewRequestModalProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isApprove = action === "approved";

  useEffect(() => {
    if (!open) return;
    setNote("");
    setError("");
    setLoading(false);
  }, [open, request?.id, action]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!request || !action) return;
    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await reviewRequest(token, request.id, {
        status: action,
        review_note: note.trim() || undefined,
      });
      onOpenChange(false);
      void onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to review request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-panel-bg text-text-main sm:max-w-md p-0 gap-0" showCloseButton={!loading}>
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            {isApprove ? "Approve leave request" : "Reject leave request"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {request
              ? `${request.requester_name} · ${formatRequestDate(request.from_date)} to ${formatRequestDate(request.to_date)}`
              : "Review this leave request."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {error ? (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <Textarea
            name="review_note"
            label="Note (optional)"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={isApprove ? "Add an optional approval note" : "Add a reason for rejection"}
            className="rounded-md"
          />
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border-main bg-panel-bg px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="px-5 py-2.5 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isApprove ? "primary" : "danger"}
            loading={loading}
            onClick={() => void handleConfirm()}
            className={
              isApprove
                ? "px-5 py-2.5 text-sm"
                : "border border-danger-border bg-danger px-5 py-2.5 text-sm text-white hover:bg-danger/90 hover:text-white"
            }
          >
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
