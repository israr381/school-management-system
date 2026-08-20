import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import type { SchoolClass, SchoolSection } from "../../../store/classes";
import type { Teacher } from "../../../store/teachers";
import {
  saveTeacherAssignment,
  type TeacherClassAssignment,
} from "../../../store/teacherAssignments";
import Button from "../../button/Button";
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

interface AssignClassModalProps {
  open: boolean;
  assignment?: TeacherClassAssignment | null;
  teachers: Teacher[];
  classes: SchoolClass[];
  sections: SchoolSection[];
  assignments: TeacherClassAssignment[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function AssignClassModal({
  open,
  assignment,
  teachers,
  classes,
  sections,
  assignments,
  onOpenChange,
  onSuccess,
}: AssignClassModalProps) {
  const isEditing = Boolean(assignment);
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTeacherId(assignment ? String(assignment.teacher_id) : "");
    setClassId(assignment ? String(assignment.class_id) : "");
    setSectionId(assignment ? String(assignment.section_id) : "");
    setError("");
    setLoading(false);
  }, [open, assignment]);

  const sortedTeachers = useMemo(
    () => [...teachers].sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: "base" })),
    [teachers],
  );

  const classSections = useMemo(
    () => sections.filter((section) => String(section.class_id) === classId),
    [classId, sections],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleTeacherChange = (value: string | null) => {
    const nextTeacherId = value ?? "";
    setTeacherId(nextTeacherId);

    const existing = assignments.find((assignment) => String(assignment.teacher_id) === nextTeacherId);
    if (existing) {
      setClassId(String(existing.class_id));
      setSectionId(String(existing.section_id));
      return;
    }

    setClassId("");
    setSectionId("");
  };

  const handleClassChange = (value: string | null) => {
    setClassId(value ?? "");
    setSectionId("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!teacherId) {
      setError(teachers.length === 0 ? "Add a teacher first before assigning a class." : "Please select a teacher.");
      return;
    }
    if (!classId) {
      setError(classes.length === 0 ? "Add a class first before assigning a teacher." : "Please select a class.");
      return;
    }
    if (!sectionId) {
      setError(
        classSections.length === 0
          ? "Add a section for this class first before assigning a teacher."
          : "Please select a section.",
      );
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setLoading(true);

    try {
      await saveTeacherAssignment(token, {
        teacher_id: Number(teacherId),
        class_id: Number(classId),
        section_id: Number(sectionId),
      });
      onOpenChange(false);
      void onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-panel-bg text-text-main sm:max-w-lg p-0 gap-0"
        showCloseButton={!loading}
      >
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            {isEditing ? "Edit Assignment" : "Assign Class"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {isEditing
              ? "Update the class and section assigned to this teacher."
              : "Select one teacher, one class, and one section. Example: Teacher Ahmed → Class 10-A."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="w-full">
            <div className="mb-2 flex items-center">
              <Label htmlFor="assign_teacher_id" className="block text-sm font-medium leading-5 text-text-main">
                Teacher
              </Label>
            </div>
            <Select
              id="assign_teacher_id"
              name="assign_teacher_id"
              required
              modal={false}
              disabled={isEditing}
              value={teacherId || null}
              onValueChange={handleTeacherChange}
              items={sortedTeachers.map((teacher) => ({
                value: String(teacher.id),
                label: teacher.full_name,
              }))}
            >
              <SelectTrigger className={selectTriggerClass} disabled={isEditing}>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="rounded-md border-border-main bg-panel-bg text-text-main"
              >
                {sortedTeachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={String(teacher.id)} className="cursor-pointer">
                    {teacher.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <div className="mb-2 flex items-center">
              <Label htmlFor="assign_class_id" className="block text-sm font-medium leading-5 text-text-main">
                Class
              </Label>
            </div>
            <Select
              id="assign_class_id"
              name="assign_class_id"
              required
              modal={false}
              value={classId || null}
              onValueChange={handleClassChange}
              items={classes.map((schoolClass) => ({
                value: String(schoolClass.id),
                label: schoolClass.name,
              }))}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="rounded-md border-border-main bg-panel-bg text-text-main"
              >
                {classes.map((schoolClass) => (
                  <SelectItem key={schoolClass.id} value={String(schoolClass.id)} className="cursor-pointer">
                    {schoolClass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <div className="mb-2 flex items-center">
              <Label htmlFor="assign_section_id" className="block text-sm font-medium leading-5 text-text-main">
                Section
              </Label>
            </div>
            <Select
              id="assign_section_id"
              name="assign_section_id"
              required
              modal={false}
              disabled={!classId}
              value={sectionId || null}
              onValueChange={(value: string | null) => setSectionId(value ?? "")}
              items={classSections.map((section) => ({
                value: String(section.id),
                label: section.name,
              }))}
            >
              <SelectTrigger className={selectTriggerClass} disabled={!classId}>
                <SelectValue placeholder={classId ? "Select a section" : "Select a class first"} />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="rounded-md border-border-main bg-panel-bg text-text-main"
              >
                {classSections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)} className="cursor-pointer">
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-border-main bg-transparent px-0 pb-0 pt-2">
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
              {isEditing ? "Save Changes" : "Save Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
