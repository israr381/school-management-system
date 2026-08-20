import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import type { SchoolClass, SchoolSection } from "../../../store/classes";
import {
  fetchStudentAttendance,
  saveStudentAttendance,
  type AttendanceStatus,
  type StudentAttendanceRecord,
  type StudentAttendanceSummary,
} from "../../../store/attendance";
import Button from "../../button/Button";
import Input from "../../input/Input";
import AttendanceStatusPicker from "../../attendance/AttendanceStatusPicker";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

const selectTriggerClass =
  "h-12.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer";

function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface TakeStudentAttendanceModalProps {
  open: boolean;
  locked: boolean;
  defaultClassId?: string;
  defaultSectionId?: string;
  defaultClassName?: string;
  defaultSectionName?: string;
  classes: SchoolClass[];
  sections: SchoolSection[];
  editing?: StudentAttendanceSummary | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function TakeStudentAttendanceModal({
  open,
  locked,
  defaultClassId = "",
  defaultSectionId = "",
  defaultClassName = "",
  defaultSectionName = "",
  classes,
  sections,
  editing,
  onOpenChange,
  onSuccess,
}: TakeStudentAttendanceModalProps) {
  const isEditing = Boolean(editing);
  const [attendanceDate, setAttendanceDate] = useState(todayDate);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const classSections = useMemo(
    () => sections.filter((section) => String(section.class_id) === classId),
    [classId, sections],
  );

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);
    setAttendanceDate(editing?.attendance_date ?? todayDate());
    setClassId(editing ? String(editing.class_id) : defaultClassId);
    setSectionId(editing ? String(editing.section_id) : defaultSectionId);
    setClassName(editing?.class_name ?? defaultClassName);
    setSectionName(editing?.section_name ?? defaultSectionName);
    setRecords([]);
  }, [open, editing, defaultClassId, defaultSectionId, defaultClassName, defaultSectionName]);

  useEffect(() => {
    if (!open || !classId || !sectionId || !attendanceDate) {
      return;
    }

    let cancelled = false;
    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setLoadingSheet(true);
    void fetchStudentAttendance(token, {
      attendance_date: attendanceDate,
      class_id: Number(classId),
      section_id: Number(sectionId),
    })
      .then((sheet) => {
        if (cancelled) return;
        setRecords(sheet.records);
        setCanEdit(sheet.can_edit);
        setClassName(sheet.class_name);
        setSectionName(sheet.section_name);
        setError(
          sheet.records.length === 0 ? "There are no active students in this class and section." : "",
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecords([]);
          setError(err instanceof Error ? err.message : "Failed to load students.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSheet(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, attendanceDate, classId, sectionId]);

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
    if (!classId || !sectionId) {
      setError("Please select a class and section.");
      return;
    }
    if (records.length === 0) {
      setError("There are no students to mark.");
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
      await saveStudentAttendance(token, {
        attendance_date: attendanceDate,
        class_id: Number(classId),
        section_id: Number(sectionId),
        records: records.map(({ student_id, status }) => ({ student_id, status })),
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
            {isEditing ? "Edit Student Attendance" : "Take Student Attendance"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Mark each student present, absent, or late. Use Mark all present to fill the list quickly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              type="date"
              name="student_attendance_date"
              label="Date"
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
              className="h-12.5 rounded-md py-0"
            />
            <div className="w-full">
              <div className="mb-2 flex items-center">
                <Label className="block text-sm font-medium leading-5 text-text-main">Class</Label>
              </div>
              {locked ? (
                <div className="flex h-12.5 items-center rounded-md border border-border-main bg-surface-soft px-4 text-sm font-semibold text-text-main">
                  {className || "Assigned class"}
                </div>
              ) : (
                <Select
                  value={classId || null}
                  onValueChange={(value: string | null) => {
                    setClassId(value ?? "");
                    setSectionId("");
                    setRecords([]);
                  }}
                  items={classes.map((schoolClass) => ({
                    value: String(schoolClass.id),
                    label: schoolClass.name,
                  }))}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false} className="rounded-md border-border-main bg-panel-bg text-text-main">
                    {classes.map((schoolClass) => (
                      <SelectItem key={schoolClass.id} value={String(schoolClass.id)} className="cursor-pointer">
                        {schoolClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="w-full">
              <div className="mb-2 flex items-center">
                <Label className="block text-sm font-medium leading-5 text-text-main">Section</Label>
              </div>
              {locked ? (
                <div className="flex h-12.5 items-center rounded-md border border-border-main bg-surface-soft px-4 text-sm font-semibold text-text-main">
                  {sectionName || "Assigned section"}
                </div>
              ) : (
                <Select
                  disabled={!classId}
                  value={sectionId || null}
                  onValueChange={(value: string | null) => {
                    setSectionId(value ?? "");
                    setRecords([]);
                  }}
                  items={classSections.map((section) => ({
                    value: String(section.id),
                    label: section.name,
                  }))}
                >
                  <SelectTrigger className={selectTriggerClass} disabled={!classId}>
                    <SelectValue placeholder={classId ? "Select a section" : "Select a class first"} />
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false} className="rounded-md border-border-main bg-panel-bg text-text-main">
                    {classSections.map((section) => (
                      <SelectItem key={section.id} value={String(section.id)} className="cursor-pointer">
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
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
            <p className="py-8 text-center text-sm text-text-muted">Loading students...</p>
          ) : records.length > 0 ? (
            <div className="max-h-80 overflow-y-auto rounded-xl border border-border-main">
              {records.map((record) => (
                <div
                  key={record.student_id}
                  className="flex flex-col gap-2 border-b border-border-main px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold text-text-main">{record.full_name}</span>
                  <AttendanceStatusPicker
                    value={record.status}
                    disabled={!canEdit}
                    onChange={(status) =>
                      setRecords((current) =>
                        current.map((item) =>
                          item.student_id === record.student_id ? { ...item, status } : item,
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
