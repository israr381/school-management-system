import { useState } from "react";
import { createOrganization } from "../../store/organization";

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
  // Form states for creating organization
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

      // Reload tenant statistics table
      await refreshStats();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong during form submission.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Tenant Registry Table Section */}
      <div className="bg-panel-bg rounded-3xl border border-border-main/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-main flex justify-between items-center bg-app-bg/50">
          <div>
            <h3 className="font-bold text-lg">Tenant Organization Registry</h3>
            <p className="text-xs text-text-muted mt-0.5">List of schools and workspaces created by users</p>
          </div>
          <span className="text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full font-bold">
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
                    <td className="px-6 py-4 font-mono font-medium text-xs text-purple-600 dark:text-purple-400">
                      #{tenant.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-main">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-muted">
                      {tenant.domain}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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

      {/* 2. Add Organization Form Section */}
      <div className="max-w-xl mx-auto py-6">
        <div className="bg-panel-bg border border-border-main/50 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
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
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm animate-pulse">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Organization details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  1. Organization Details
                </h3>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="organization_name"
                    required
                    value={form.organization_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Oakridge Academy"
                    className="w-full px-4 py-3 rounded-xl border border-border-main bg-input-bg text-text-main placeholder-text-muted/65 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Organization Domain
                  </label>
                  <input
                    type="text"
                    name="organization_domain"
                    required
                    value={form.organization_domain}
                    onChange={handleInputChange}
                    placeholder="e.g. oakridge.edu"
                    className="w-full px-4 py-3 rounded-xl border border-border-main bg-input-bg text-text-main placeholder-text-muted/65 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <hr className="border-border-main my-6" />

              {/* Admin account details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  2. Primary Admin Account
                </h3>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    name="admin_full_name"
                    required
                    value={form.admin_full_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-3 rounded-xl border border-border-main bg-input-bg text-text-main placeholder-text-muted/65 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Admin Login Email
                  </label>
                  <input
                    type="email"
                    name="admin_email"
                    required
                    value={form.admin_email}
                    onChange={handleInputChange}
                    placeholder="e.g. s.jenkins@oakridge.edu"
                    className="w-full px-4 py-3 rounded-xl border border-border-main bg-input-bg text-text-main placeholder-text-muted/65 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    name="admin_password"
                    required
                    minLength={6}
                    value={form.admin_password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-border-main bg-input-bg text-text-main placeholder-text-muted/65 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center cursor-pointer"
              >
                {formLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  "Create Organization"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
