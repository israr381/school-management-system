import { useState } from "react";
import { Building2, CheckCircle2, Globe } from "lucide-react";
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
    <div className="dash-enter space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border-main bg-panel-bg shadow-xl shadow-text-main/5">
        <div className="absolute inset-0 bg-linear-to-br from-brand-soft via-transparent to-transparent pointer-events-none" />
        <div className="relative p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand border border-brand-soft-border flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand mb-1">Organization</p>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-main">
              School profile
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Update how <span className="font-semibold text-text-main">{org?.name || "your school"}</span> appears across EduManage.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border-main bg-panel-bg shadow-xl shadow-text-main/5 p-6 md:p-8">
        {org && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-surface-soft border border-border-main px-3.5 py-3">
              <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Current name</p>
                <p className="text-xs font-semibold text-text-main truncate">{org.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-surface-soft border border-border-main px-3.5 py-3">
              <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Current domain</p>
                <p className="text-xs font-semibold text-text-main truncate">{org.domain}</p>
              </div>
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-5 p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm">
            {formError}
          </div>
        )}

        {formSuccess && (
          <div className="mb-5 p-3.5 rounded-xl bg-success-bg border border-success-border text-success text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
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
            leftIcon={<Building2 className="w-4.5 h-4.5" />}
          />

          <Input
            type="text"
            name="domain"
            label="Organization Domain"
            required
            value={form.domain}
            onChange={handleInputChange}
            placeholder="e.g. oakridge.edu"
            leftIcon={<Globe className="w-4.5 h-4.5" />}
          />

          <Button type="submit" loading={formLoading} fullWidth className="mt-2">
            Save Changes
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-text-muted">
          Editing as {user.full_name} · <span className="capitalize">{user.role.replace("_", " ")}</span>
        </p>
      </section>
    </div>
  );
}
