import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import {
  createSubject,
  updateSubject,
  type SchoolClass,
  type SchoolSection,
  type SchoolSubject,
} from "../../../store/classes";
import Button from "../../button/Button";
import Input from "../../input/Input";
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

interface SubjectFormModalProps {
  open: boolean;
  subject?: SchoolSubject | null;
  classes: SchoolClass[];
  sections: SchoolSection[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function SubjectFormModal({
  open,
  subject,
  classes,
  sections,
  onOpenChange,
  onSuccess,
}: SubjectFormModalProps) {
  const isEditing = Boolean(subject);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setClassId(subject ? String(subject.class_id) : "");
    setSectionId(subject ? String(subject.section_id) : "");
    setName(subject?.name ?? "");
    setError("");
    setLoading(false);
  }, [open, subject]);

  const classSections = useMemo(
    () => sections.filter((section) => String(section.class_id) === classId),
    [classId, sections],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleClassChange = (value: string | null) => {
    setClassId(value ?? "");
    setSectionId("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!classId) {
      setError(classes.length === 0 ? "Add a class first before creating a subject." : "Please select a class.");
      return;
    }
    if (!sectionId) {
      setError(
        classSections.length === 0
          ? "Add a section for this class first before creating a subject."
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

    const payload = {
      name: name.trim(),
      class_id: Number(classId),
      section_id: Number(sectionId),
    };

    try {
      if (isEditing && subject) {
        await updateSubject(token, subject.id, payload);
      } else {
        await createSubject(token, payload);
      }
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
            {isEditing ? "Edit Subject" : "Add Subject"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {isEditing
              ? "Update the class, section, and subject name."
              : "Select a class and section, then enter the subject name."}
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
              <Label htmlFor="class_id" className="block text-sm font-medium leading-5 text-text-main">
                Class
              </Label>
            </div>
            <Select
              id="class_id"
              name="class_id"
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
                  <SelectItem
                    key={schoolClass.id}
                    value={String(schoolClass.id)}
                    className="cursor-pointer"
                  >
                    {schoolClass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <div className="mb-2 flex items-center">
              <Label htmlFor="section_id" className="block text-sm font-medium leading-5 text-text-main">
                Section
              </Label>
            </div>
            <Select
              id="section_id"
              name="section_id"
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
                <SelectValue
                  placeholder={classId ? "Select a section" : "Select a class first"}
                />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="rounded-md border-border-main bg-panel-bg text-text-main"
              >
                {classSections.map((section) => (
                  <SelectItem
                    key={section.id}
                    value={String(section.id)}
                    className="cursor-pointer"
                  >
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="text"
            name="subject_name"
            label="Subject Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Mathematics"
            className="h-12.5 rounded-md py-0"
          />

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
              {isEditing ? "Save Changes" : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
