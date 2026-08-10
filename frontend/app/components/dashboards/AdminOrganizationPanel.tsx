import { useState } from "react";
import { updateOrganization } from "../../store/organization";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  organization: {
    id: number;
    name: string;
    domain: string;
  } | null;
}

interface AdminOrganizationPanelProps {
  user: UserResponse;
  org: UserResponse["organization"];
  setOrg: (org: UserResponse["organization"]) => void;
}

export default function AdminOrganizationPanel({ user, org, setOrg }: AdminOrganizationPanelProps) {
  const [form, setForm] = useState({
    name: org?.name || "",
    domain: org?.domain || "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setFormError("Authentication session expired. Please sign in again.");
      setFormLoading(false);
      return;
    }

    try {
      const data = await updateOrganization(token, form);
      setFormSuccess("Organization details updated successfully!");
      setOrg(data);
    } catch (err: any) {
      setFormError(err.message || "An error occurred while updating the organization.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in py-6">
      <div className="bg-panel-bg border border-border-main/50 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
        <div className="relative">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-role-active-text bg-role-badge-bg/50 px-3 py-1 rounded-full uppercase tracking-wider">
              Management
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-text-main tracking-tight">
              Organization Settings
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Manage and update your school profile settings below.
            </p>
          </div>

          {formError && (
            <div className="mb-6 p-4 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm animate-pulse">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-success-bg border border-success-border text-success text-sm">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
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

            <Button type="submit" loading={formLoading} fullWidth className="mt-4">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
