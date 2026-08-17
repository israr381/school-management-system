import { useEffect, useState } from "react";
import { updateOrganizationById } from "../../../store/organization";
import Button from "../../button/Button";
import Input from "../../input/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface OrganizationToEdit {
  id: number;
  name: string;
  domain: string;
}

interface EditOrganizationModalProps {
  open: boolean;
  organization: OrganizationToEdit | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function EditOrganizationModal({
  open,
  organization,
  onOpenChange,
  onSuccess,
}: EditOrganizationModalProps) {
  const [form, setForm] = useState({ name: "", domain: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !organization) return;
    setForm({ name: organization.name, domain: organization.domain });
    setError("");
    setLoading(false);
  }, [open, organization]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      await updateOrganizationById(token, organization.id, {
        name: form.name,
        domain: form.domain,
      });
      await onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to update organization.");
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
            Edit Organization
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Update the organization name and domain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm">
              {error}
            </div>
          )}

          <Input
            type="text"
            name="name"
            label="Organization Name"
            required
            value={form.name}
            onChange={handleInputChange}
            placeholder="e.g. Oakridge Academy"
          />
          <Input
            type="text"
            name="domain"
            label="Organization Domain"
            required
            value={form.domain}
            onChange={handleInputChange}
            placeholder="e.g. oakridge.edu"
          />

          <DialogFooter className="mx-0 mb-0 rounded-none border-border-main bg-transparent px-0 pb-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className=""
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className=" py-2.5 px-5">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
