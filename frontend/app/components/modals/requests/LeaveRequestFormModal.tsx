import { useEffect, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import { createMyRequest } from "../../../store/requests";
import Button from "../../button/Button";
import Textarea from "../../input/Textarea";
import { DatePicker } from "~/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface LeaveRequestFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

const emptyForm = {
  from_date: "",
  to_date: "",
  reason: "",
};

export default function LeaveRequestFormModal({
  open,
  onOpenChange,
  onSuccess,
}: LeaveRequestFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setError("");
    setLoading(false);
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.from_date || !form.to_date) {
      setError("Please select the leave start and end dates.");
      return;
    }
    if (form.to_date < form.from_date) {
      setError("The end date cannot be before the start date.");
      return;
    }
    if (form.reason.trim().length < 3) {
      setError("Please add a short reason for this leave request.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      await createMyRequest(token, {
        from_date: form.from_date,
        to_date: form.to_date,
        reason: form.reason.trim(),
      });
      onOpenChange(false);
      void onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-hidden bg-panel-bg text-text-main sm:max-w-lg p-0 gap-0"
        showCloseButton={!loading}
      >
        <DialogHeader className="shrink-0 border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            New Leave Request
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Submit a leave request. Only leave is available for now.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error ? (
              <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <div className="rounded-xl border border-border-main bg-surface-soft px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Request type
              </p>
              <p className="mt-1 text-sm font-semibold text-text-main">Leave</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                name="from_date"
                label="From date"
                value={form.from_date}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    from_date: value,
                    to_date: current.to_date && current.to_date < value ? value : current.to_date,
                  }))
                }
                placeholder="Start date"
              />
              <DatePicker
                name="to_date"
                label="To date"
                value={form.to_date}
                onChange={(value) => setForm((current) => ({ ...current, to_date: value }))}
                minDate={form.from_date || undefined}
                placeholder="End date"
              />
            </div>

            <Textarea
              name="reason"
              label="Reason"
              required
              rows={4}
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Why do you need this leave?"
              className="rounded-md"
            />
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border-main bg-panel-bg px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="px-5 py-2.5 text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="px-5 py-2.5 text-sm">
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
