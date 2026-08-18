import type { ReactNode } from "react";
import type { Student } from "../../../store/students";
import Button from "../../button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface StudentViewModalProps {
  open: boolean;
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (student: Student) => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "active"
      ? "bg-success-bg text-success border-success-border"
      : status === "disabled"
        ? "bg-danger-bg text-danger border-danger-border"
        : "bg-surface-soft text-text-muted border-border-main";
  const dot =
    status === "active"
      ? "bg-success animate-pulse"
      : status === "disabled"
        ? "bg-danger"
        : "bg-icon-muted";
  const label =
    status === "active" ? "Active" : status === "disabled" ? "Disabled" : "Graduated";

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

export default function StudentViewModal({
  open,
  student,
  onOpenChange,
  onEdit,
}: StudentViewModalProps) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-panel-bg text-text-main sm:max-w-2xl p-0 gap-0"
      >
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            Student Details
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Full student and parent information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-role-active-text">
              1. Student Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Name" value={student.full_name} />
              <DetailItem label="Email" value={student.email} />
              <DetailItem label="Phone" value={student.phone} />
              <DetailItem label="Status" value={<StatusBadge status={student.status} />} />
              <DetailItem label="Class" value={student.class_name} />
              <DetailItem label="Section" value={student.section_name} />
              <DetailItem
                label="Admission Date"
                value={new Date(student.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              />
              <DetailItem label="Address" value={student.address} />
            </div>
          </div>

          <hr className="border-border-main" />

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-role-active-text">
              2. Father or Guardian
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem
                label="Relationship"
                value={
                  <span className="capitalize">{student.parent.relationship}</span>
                }
              />
              <DetailItem label="Name" value={student.parent.full_name} />
              <DetailItem label="Email" value={student.parent.email} />
              <DetailItem label="Phone" value={student.parent.phone} />
              <div className="sm:col-span-2">
                <DetailItem label="Address" value={student.parent.address} />
              </div>
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
              onClick={() => onEdit(student)}
              className="px-5 py-2.5 text-sm"
            >
              Edit Student
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
