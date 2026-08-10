import { useState } from "react";
import { createOrganization } from "../../store/organization";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface Tenant {
  id: number;
  name: string;
  domain: string;
  created_at: string;
  user_count: number;
}

interface TenantApiResponse {
  total_tenants: number;
  total_users: number;
  tenants: Tenant[];
}

interface SuperAdminOrganizationPanelProps {
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;
}

export default function SuperAdminOrganizationPanel({
  tenantData,
  statsLoading,
  refreshStats
}: SuperAdminOrganizationPanelProps) {
  const [form, setForm] = useState({
    organization_name: "",
    organization_domain: "",
    admin_full_name: "",
    admin_email: "",
    admin_password: "",
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
      await createOrganization(token, form);
      setFormSuccess("Organization and admin account created successfully!");
      setForm({
        organization_name: "",
        organization_domain: "",
        admin_full_name: "",
        admin_email: "",
        admin_password: "",
      });

      await refreshStats();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong during form submission.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-panel-bg rounded-3xl border border-border-main/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-main flex justify-between items-center bg-app-bg/50">
          <div>
            <h3 className="font-bold text-lg">Tenant Organization Registry</h3>
            <p className="text-xs text-text-muted mt-0.5">List of schools and workspaces created by users</p>
          </div>
          <span className="text-xs bg-role-badge-bg text-role-badge-text px-3 py-1 rounded-full font-bold">
            {statsLoading ? "..." : (tenantData?.tenants.length || 0)} Registered
          </span>
        </div>

        {statsLoading && !tenantData ? (
          <div className="p-12 text-center text-text-muted font-medium">
            Loading tenants...
          </div>
        ) : tenantData && tenantData.tenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main text-xs font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Organization Name</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main text-sm">
                {tenantData.tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-app-bg/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-xs text-role-active-text">
                      #{tenant.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-main">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-muted">
                      {tenant.domain}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-info-bg text-info">
                        👤 {tenant.user_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted">
                      {new Date(tenant.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }) || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-success-bg text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-stat-success" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-app-bg flex items-center justify-center text-3xl mx-auto mb-4 border border-border-main">
              🏢
            </div>
            <h4 className="font-semibold text-base mb-1">No Tenants Found</h4>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              No organization registrations exist yet. Registered organizations will show here.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto py-6">
        <div className="bg-panel-bg border border-border-main/50 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          <div className="relative">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-role-active-text bg-role-badge-bg/50 px-3 py-1 rounded-full uppercase tracking-wider">
                Administration
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-text-main tracking-tight">
                Add New Organization
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Register a new school tenant and set up its primary administrator.
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
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-role-active-text">
                  1. Organization Details
                </h3>
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

              <hr className="border-border-main my-6" />

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

                <Input
                  type="password"
                  name="admin_password"
                  label="Admin Password"
                  required
                  minLength={6}
                  value={form.admin_password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" loading={formLoading} fullWidth className="mt-4">
                Create Organization
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
