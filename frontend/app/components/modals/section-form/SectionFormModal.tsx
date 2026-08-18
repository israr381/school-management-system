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
              onValueChange={(value: string | null) => setClassId(value ?? "")}
              items={classes.map((schoolClass) => ({
                value: String(schoolClass.id),
                label: schoolClass.name,
              }))}
            >
              <SelectTrigger
                className="h-12.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
              >
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
          <Input
            type="text"
            name="section_name"
            label="Section Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Section A"
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
              {isEditing ? "Save Changes" : "Add Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
