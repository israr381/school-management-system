import type { ReactNode } from "react";
import type { Teacher } from "../../../store/teachers";
import Button from "../../button/Button";
import UserAvatar from "../../settings/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface TeacherViewModalProps {
  open: boolean;
  teacher: Teacher | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (teacher: Teacher) => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "active"
      ? "bg-success-bg text-success border-success-border"
      : "bg-danger-bg text-danger border-danger-border";
  const dot = status === "active" ? "bg-success animate-pulse" : "bg-danger";
  const label = status === "active" ? "Active" : "Disabled";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-text-main">
        {value || "—"}
      </div>
    </div>
  );
}

export default function TeacherViewModal({
  open,
  teacher,
  onOpenChange,
  onEdit,
}: TeacherViewModalProps) {
  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-panel-bg text-text-main sm:max-w-2xl p-0 gap-0"
      >
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            Teacher Details
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Full teacher profile and login email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={teacher.full_name}
              avatarUrl={teacher.avatar_url}
              className="h-16 w-16 rounded-sm text-lg"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-text-main">{teacher.full_name}</p>
              <p className="truncate text-sm text-text-muted">{teacher.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Name" value={teacher.full_name} />
            <DetailItem label="Email" value={teacher.email} />
            <DetailItem label="Phone" value={teacher.phone} />
            <DetailItem label="Subject" value={teacher.subject} />
            <DetailItem label="Status" value={<StatusBadge status={teacher.status} />} />
            <DetailItem
              label="Joined"
              value={new Date(teacher.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
            <div className="sm:col-span-2">
              <DetailItem label="Address" value={teacher.address} />
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border-main bg-transparent px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 text-sm"
          >
            Close
          </Button>
          {onEdit && (
            <Button
              type="button"
              onClick={() => onEdit(teacher)}
              className="px-5 py-2.5 text-sm"
            >
              Edit Teacher
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
