import { useMemo, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { createOrganization } from "../../store/organization";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Table, { type TableColumn } from "../ui/Table";

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

const emptyForm = {
  organization_name: "",
  organization_domain: "",
  admin_full_name: "",
  admin_email: "",
  admin_password: "",
};

export default function SuperAdminOrganizationPanel({
  tenantData,
  statsLoading,
  refreshStats,
}: SuperAdminOrganizationPanelProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const openModal = () => {
    setForm(emptyForm);
    setFormError("");
    setFormSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (formLoading) return;
    setModalOpen(false);
    setFormError("");
    setFormSuccess("");
  };

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
      setForm(emptyForm);
      await refreshStats();

      window.setTimeout(() => {
        setModalOpen(false);
        setFormSuccess("");
      }, 900);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong during form submission.");
    } finally {
      setFormLoading(false);
    }
  };

  const tenants = tenantData?.tenants ?? [];

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;

    return tenants.filter((tenant) => {
      const haystack = [
        String(tenant.id),
        tenant.name,
        tenant.domain,
        String(tenant.user_count),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, tenants]);

  const columns = useMemo<TableColumn<Tenant>[]>(
    () => [
      {
        key: "id",
        header: "ID",
        sortable: true,
        sortValue: (tenant) => tenant.id,
        className: "font-mono font-medium text-xs text-role-active-text",
        render: (tenant) => `#${tenant.id}`,
      },
      {
        key: "name",
        header: "Organization Name",
        sortable: true,
        sortValue: (tenant) => tenant.name,
        className: "font-semibold text-text-main",
        render: (tenant) => tenant.name,
      },
      {
        key: "domain",
        header: "Domain",
        sortable: true,
        sortValue: (tenant) => tenant.domain,
        className: "font-medium text-text-muted",
        render: (tenant) => tenant.domain,
      },
      {
        key: "user_count",
        header: "Users",
        sortable: true,
        sortValue: (tenant) => tenant.user_count,
        className: "font-semibold text-text-main",
        render: (tenant) => tenant.user_count,
      },
      {
        key: "created_at",
        header: "Created Date",
        sortable: true,
        sortValue: (tenant) => new Date(tenant.created_at),
        className: "font-medium text-text-muted",
        render: (tenant) =>
          new Date(tenant.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }) || "Unknown",
      },
      {
        key: "status",
        header: "Status",
        className: "font-semibold text-success",
        render: () => "Active",
      },
    ],
    []
  );

  const showingLabel =
    filteredTenants.length === 0
      ? "Showing 0 data."
      : `Showing 1-${filteredTenants.length} data.`;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            Tenant Organization Registry
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            List of schools and workspaces created by users
          </p>
        </div>

        <Button
          type="button"
          onClick={openModal}
          className="!py-2.5 !px-4 !rounded-lg !text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </Button>
      </div>

      <hr className="border-border-main" />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-text-muted">{showingLabel}</p>

        <div className="w-full sm:w-64">
          <Input
            type="search"
            name="organization_search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            leftIcon={<Search className="w-4 h-4" />}
            className="!py-2.5 !rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden">
        {statsLoading && !tenantData ? (
          <div className="p-12 text-center text-text-muted font-medium">
            Loading tenants...
          </div>
        ) : filteredTenants.length > 0 ? (
          <Table
            columns={columns}
            data={filteredTenants}
            rowKey={(tenant) => tenant.id}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border-main bg-panel-bg p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-surface-soft text-role-active-text">
              <Building2 className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-base mb-1">
              {tenants.length === 0 ? "No Tenants Found" : "No Matches"}
            </h4>
            <p className="text-sm text-text-muted max-w-sm mx-auto mb-5">
              {tenants.length === 0
                ? "No organization registrations exist yet. Create your first tenant to get started."
                : "No organizations match your search. Try a different keyword."}
            </p>
            {tenants.length === 0 && (
              <Button
                type="button"
                onClick={openModal}
                className="!py-2.5 !px-4 !rounded-lg !text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Organization
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Add New Organization"
        description="Register a new school tenant and set up its primary administrator."
        size="lg"
      >
        {formError && (
          <div className="mb-5 p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm">
            {formError}
          </div>
        )}

        {formSuccess && (
          <div className="mb-5 p-3.5 rounded-xl bg-success-bg border border-success-border text-success text-sm">
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={formLoading}
              className="!rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading} className="!rounded-xl !py-2.5 !px-5">
              Create Organization
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
