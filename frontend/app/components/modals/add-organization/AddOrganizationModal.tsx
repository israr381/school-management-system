import { useEffect, useState } from "react";
import { createOrganization } from "../../../store/organization";
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

const emptyForm = {
  organization_name: "",
  organization_domain: "",
  admin_full_name: "",
  admin_email: "",
};

interface AddOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export default function AddOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
}: AddOrganizationModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setError("");
    setLoading(false);
  }, [open]);

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
    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      await createOrganization(token, form);
      onOpenChange(false);
      void onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong during form submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-panel-bg text-text-main sm:max-w-2xl p-0 gap-0"
        showCloseButton={!loading}
      >
        <DialogHeader className="border-b border-border-main px-6 py-5">
          <DialogTitle className="text-xl font-bold tracking-tight text-text-main">
            Add New Organization
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Register a new school tenant and set up its primary administrator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-role-active-text">
              1. Organization Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="text"
                name="organization_name"
                label="Organization Name"
                required
                value={form.organization_name}
                onChange={handleInputChange}
                placeholder="e.g. Oakridge Academy"
              />
              <Input
                type="text"
                name="organization_domain"
                label="Organization Domain"
                required
                value={form.organization_domain}
                onChange={handleInputChange}
                placeholder="e.g. oakridge.edu"
              />
            </div>
          </div>

          <hr className="border-border-main" />

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-role-active-text">
              2. Primary Admin Account
            </h3>
            <Input
              type="text"
              name="admin_full_name"
              label="Admin Full Name"
              required
              value={form.admin_full_name}
              onChange={handleInputChange}
              placeholder="e.g. Sarah Jenkins"
            />
            <Input
              type="email"
              name="admin_email"
              label="Admin Login Email"
              required
              value={form.admin_email}
              onChange={handleInputChange}
              placeholder="e.g. s.jenkins@oakridge.edu"
            />
          </div>

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
              Create Organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
