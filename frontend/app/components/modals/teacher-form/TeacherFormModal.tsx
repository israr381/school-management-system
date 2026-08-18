import { useEffect, useState } from "react";
import { getAccessToken } from "../../../store/auth";
import {
  createTeacher,
  updateTeacher,
  type Teacher,
} from "../../../store/teachers";
import Button from "../../button/Button";
import Input from "../../input/Input";
import Textarea from "../../input/Textarea";
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

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  subject: "",
  status: "active",
};

const selectTriggerClass =
  "h-12.5 w-full rounded-md border-border-main bg-input-bg px-4 py-0 text-sm text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand cursor-pointer";

interface TeacherFormModalProps {
  open: boolean;
  teacher?: Teacher | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function TeacherFormModal({
  open,
  teacher,
  onOpenChange,
  onSuccess,
}: TeacherFormModalProps) {
  const isEditing = Boolean(teacher);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(
      teacher
        ? {
            full_name: teacher.full_name,
            email: teacher.email,
            phone: teacher.phone,
            address: teacher.address,
            subject: teacher.subject ?? "",
            status: teacher.status === "disabled" ? "disabled" : "active",
          }
        : emptyForm,
    );
    setError("");
    setLoading(false);
  }, [open, teacher]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
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
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      subject: form.subject.trim() || null,
    };

    try {
      if (isEditing && teacher) {
        await updateTeacher(token, teacher.id, {
          ...payload,
          status: form.status as "active" | "disabled",
        });
      } else {
        await createTeacher(token, payload);
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
        className="flex max-h-[90vh] flex-col overflow-hidden bg-panel-bg text-text-main sm:max-w-2xl p-0 gap-0"
        showCloseButton={!loading}
      >
        <DialogHeader className="shrink-0 border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            {isEditing ? "Edit Teacher" : "Add Teacher"}
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {isEditing
              ? "Update the teacher profile and login account."
              : "Create a teacher profile and a login account with the default password."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error && (
              <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <Input
                type="text"
                name="full_name"
                label="Teacher Name"
                required
                value={form.full_name}
                onChange={handleInputChange}
                placeholder="e.g. Sara Ahmed"
                className="h-12.5 rounded-md py-0"
              />
              <Input
                type="email"
                name="email"
                label="Teacher Email"
                required
                value={form.email}
                onChange={handleInputChange}
                placeholder="e.g. sara.ahmed@school.edu"
                className="h-12.5 rounded-md py-0"
              />
              <Input
                type="tel"
                name="phone"
                label="Phone"
                required
                value={form.phone}
                onChange={handleInputChange}
                placeholder="e.g. 03001234567"
                className="h-12.5 rounded-md py-0"
              />
              <Input
                type="text"
                name="subject"
                label="Subject (optional)"
                value={form.subject}
                onChange={handleInputChange}
                placeholder="e.g. Mathematics"
                className="h-12.5 rounded-md py-0"
              />
              {isEditing && (
                <div className="w-full sm:col-span-2">
                  <div className="mb-2 flex items-center">
                    <Label htmlFor="status" className="block text-sm font-medium leading-5 text-text-main">
                      Status
                    </Label>
                  </div>
                  <Select
                    id="status"
                    name="status"
                    required
                    modal={false}
                    value={form.status}
                    onValueChange={(value: string | null) =>
                      setForm((current) => ({ ...current, status: value ?? "active" }))
                    }
                    items={[
                      { value: "active", label: "Active" },
                      { value: "disabled", label: "Disabled" },
                    ]}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      alignItemWithTrigger={false}
                      className="rounded-md border-border-main bg-panel-bg text-text-main"
                    >
                      <SelectItem value="active" className="cursor-pointer">
                        Active
                      </SelectItem>
                      <SelectItem value="disabled" className="cursor-pointer">
                        Disabled
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="sm:col-span-2">
                <Textarea
                  name="address"
                  label="Address"
                  required
                  rows={3}
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="Street, city, and area"
                  className="rounded-md"
                />
              </div>
            </div>
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
              {isEditing ? "Save Changes" : "Add Teacher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
