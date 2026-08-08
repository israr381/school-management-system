import { useState } from "react";
import { updateOrganization } from "../../store/organization";

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
  // Form states for organization update
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
      <div className="bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
              Management
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Organization Settings
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage and update your school profile settings below.
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleInputChange}
                placeholder="e.g. Oakridge Academy"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                Organization Domain
              </label>
              <input
                type="text"
                name="domain"
                required
                value={form.domain}
                onChange={handleInputChange}
                placeholder="e.g. oakridge.edu"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
            >
              {formLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
