import { useEffect, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import {
  createSection,
  updateSection,
  type SchoolClass,
  type SchoolSection,
} from "../../../store/classes";
import Button from "../../button/Button";
import Input from "../../input/Input";
import Select from "../../input/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface SectionFormModalProps {
  open: boolean;
  section?: SchoolSection | null;
  classes: SchoolClass[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function SectionFormModal({
  open,
  section,
  classes,
  onOpenChange,
  onSuccess,
}: SectionFormModalProps) {
  const isEditing = Boolean(section);
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setClassId(section ? String(section.class_id) : "");
    setName(section?.name ?? "");
    setError("");
    setLoading(false);
  }, [open, section]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!classId) {
      setError("Please select a class.");
      return;
    }

    setLoading(true);

    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      class_id: Number(classId),
    };

    try {
      if (isEditing && section) {
        await updateSection(token, section.id, payload);
      } else {
        await createSection(token, payload);
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
            {isEditing ? "Edit Section" : "Add Section"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {isEditing
              ? "Update the linked class and section name."
              : "Select a class, then enter the section name."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
              {error}
            </div>
          )}

          <Select
            name="class_id"
            label="Class"
            required
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            placeholder="Select a class"
            options={classes.map((schoolClass) => ({
              value: String(schoolClass.id),
              label: schoolClass.name,
            }))}
          />
          <Input
            type="text"
            name="section_name"
            label="Section Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Section A"
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
              {isEditing ? "Save Changes" : "Add Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
