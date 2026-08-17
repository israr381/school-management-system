import { useEffect, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import { createClass, updateClass, type SchoolClass } from "../../../store/classes";
import Button from "../../button/Button";
import Input from "../../input/Input";
import Textarea from "../../input/Textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface ClassFormModalProps {
  open: boolean;
  schoolClass?: SchoolClass | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function ClassFormModal({
  open,
  schoolClass,
  onOpenChange,
  onSuccess,
}: ClassFormModalProps) {
  const isEditing = Boolean(schoolClass);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(schoolClass?.name ?? "");
    setDescription(schoolClass?.description ?? "");
    setError("");
    setLoading(false);
  }, [open, schoolClass]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const token = getAccessToken();
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
    };

    try {
      if (isEditing && schoolClass) {
        await updateClass(token, schoolClass.id, payload);
      } else {
        await createClass(token, payload);
      }
      await onSuccess?.();
      onOpenChange(false);
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
            {isEditing ? "Edit Class" : "Add Class"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {isEditing
              ? "Update the class name and description."
              : "Enter a class name and an optional description."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            type="text"
            name="class_name"
            label="Class Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Grade 5"
          />
          <Textarea
            name="class_description"
            label="Class Description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Morning session for Grade 5 students"
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
              {isEditing ? "Save Changes" : "Add Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
