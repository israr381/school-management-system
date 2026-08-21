import { useEffect, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import {
  fetchTeacherAttendance,
  saveTeacherAttendance,
  type AttendanceStatus,
  type TeacherAttendanceRecord,
  type TeacherAttendanceSummary,
} from "../../../store/attendance";
import Button from "../../button/Button";
import AttendanceStatusPicker from "../../attendance/AttendanceStatusPicker";
import { DatePicker } from "~/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface TakeTeacherAttendanceModalProps {
  open: boolean;
  editing?: TeacherAttendanceSummary | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function TakeTeacherAttendanceModal({
  open,
  editing,
  onOpenChange,
  onSuccess,
}: TakeTeacherAttendanceModalProps) {
  const isEditing = Boolean(editing);
  const [attendanceDate, setAttendanceDate] = useState(todayDate);
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);
    setAttendanceDate(editing?.attendance_date ?? todayDate());
    setRecords([]);
  }, [open, editing]);

  useEffect(() => {
    if (!open || !attendanceDate) return;

    let cancelled = false;
    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setLoadingSheet(true);
    void fetchTeacherAttendance(token, attendanceDate)
      .then((sheet) => {
        if (cancelled) return;
        setRecords(sheet.records);
        setCanEdit(sheet.can_edit);
        setError(sheet.records.length === 0 ? "There are no active teachers to mark." : "");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecords([]);
          setError(err instanceof Error ? err.message : "Failed to load teachers.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSheet(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, attendanceDate]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (saving && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const setAll = (status: AttendanceStatus) => {
    setRecords((current) => current.map((record) => ({ ...record, status })));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (records.length === 0) {
      setError("There are no teachers to mark.");
      return;
    }
    if (!canEdit) {
      setError("You do not have permission to save this attendance.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      await saveTeacherAttendance(token, {
        attendance_date: attendanceDate,
        records: records.map(({ teacher_id, status }) => ({ teacher_id, status })),
      });
      onOpenChange(false);
      void onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-panel-bg text-text-main sm:max-w-2xl p-0 gap-0"
        showCloseButton={!saving}
      >
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            {isEditing ? "Edit Teacher Attendance" : "Take Teacher Attendance"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Mark each teacher present, absent, or late. Use Mark all present to fill the list quickly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="max-w-xs">
            <DatePicker
              name="teacher_attendance_date"
              label="Date"
              value={attendanceDate}
              onChange={setAttendanceDate}
            />
          </div>

          {records.length > 0 && canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="px-3 py-2 text-sm" onClick={() => setAll("present")}>
                Mark all present
              </Button>
              <Button type="button" variant="outline" className="px-3 py-2 text-sm" onClick={() => setAll("absent")}>
                Mark all absent
              </Button>
              <Button type="button" variant="outline" className="px-3 py-2 text-sm" onClick={() => setAll("late")}>
                Mark all late
              </Button>
            </div>
          )}

          {loadingSheet ? (
            <p className="py-8 text-center text-sm text-text-muted">Loading teachers...</p>
          ) : records.length > 0 ? (
            <div className="max-h-80 overflow-y-auto rounded-xl border border-border-main">
              {records.map((record) => (
                <div
                  key={record.teacher_id}
                  className="flex flex-col gap-2 border-b border-border-main px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold text-text-main">{record.full_name}</span>
                  <AttendanceStatusPicker
                    value={record.status}
                    disabled={!canEdit}
                    onChange={(status) =>
                      setRecords((current) =>
                        current.map((item) =>
                          item.teacher_id === record.teacher_id ? { ...item, status } : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}

          <DialogFooter className="mx-0 mb-0 rounded-none border-border-main bg-transparent px-0 pb-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
              className="px-5 py-2.5 text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={!canEdit || records.length === 0} className="px-5 py-2.5 text-sm">
              Save Attendance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
