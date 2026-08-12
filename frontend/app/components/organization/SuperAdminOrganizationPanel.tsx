import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  Building2,
  Globe,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { deleteOrganization, toggleOrganizationStatus } from "../../store/organization";
import { getSuperAdminKpis } from "../dashboards/super-admin/systemData";
import Button from "../button/Button";
import Input from "../input/Input";
import AddOrganizationModal from "../modals/add-organization/AddOrganizationModal";
import EditOrganizationModal from "../modals/edit-organization/EditOrganizationModal";
import Pagination, { paginateItems } from "../pagination/Pagination";
import Table, { type TableColumn } from "../table/Table";
import OrganizationAvatar from "./OrganizationAvatar";
import { Button as UiButton } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface Tenant {
  id: number;
  name: string;
  domain: string;
  logo_url?: string | null;
  is_active?: boolean;
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

const kpiIcons = [Building2, Users, Activity, Globe];
const PAGE_SIZE_OPTIONS = [7, 10, 20, 50];

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-success-bg text-success border border-success-border"
          : "bg-surface-soft text-text-muted border border-border-main"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success animate-pulse" : "bg-icon-muted"}`}
      />
      {active ? "Active" : "Disabled"}
    </span>
  );
}

export default function SuperAdminOrganizationPanel({
  tenantData,
  statsLoading,
  refreshStats,
}: SuperAdminOrganizationPanelProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const tenants = tenantData?.tenants ?? [];
  const kpiCards = getSuperAdminKpis(tenantData, statsLoading);

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditModalOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    setEditModalOpen(open);
    if (!open) setEditingTenant(null);
  };

  const handleDelete = async (tenant: Tenant) => {
    const confirmed = window.confirm(
      `Delete "${tenant.name}"? This will also remove its users.`,
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setActionError("Authentication session expired. Please sign in again.");
      return;
    }

    setActionError("");
    setDeletingId(tenant.id);

    try {
      await deleteOrganization(token, tenant.id);
      await refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete organization.";
      setActionError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const isActive = tenant.is_active !== false;
    const action = isActive ? "disable" : "enable";
    const confirmed = window.confirm(
      `${action === "disable" ? "Disable" : "Enable"} "${tenant.name}"? ${
        action === "disable"
          ? "Users in this organization will not be able to sign in."
          : "Users in this organization will be able to sign in again."
      }`,
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setActionError("Authentication session expired. Please sign in again.");
      return;
    }

    setActionError("");
    setTogglingId(tenant.id);

    try {
      await toggleOrganizationStatus(token, tenant.id, !isActive);
      await refreshStats();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update organization status.";
      setActionError(message);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;

    return tenants.filter((tenant) =>
      [tenant.name, tenant.domain, String(tenant.user_count)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, tenants]);

  const { paginatedItems, totalPages, safePage, startIndex, endIndex } = paginateItems(
    filteredTenants,
    currentPage,
    pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const columns = useMemo<TableColumn<Tenant>[]>(
    () => [
      {
        key: "name",
        header: "Organization",
        sortable: true,
        sortValue: (tenant) => tenant.name,
        render: (tenant) => (
          <div className="flex items-center gap-3">
            <OrganizationAvatar
              name={tenant.name}
              logoUrl={tenant.logo_url}
              className="h-10 w-10 rounded-sm text-sm"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-main">{tenant.name}</p>
              <p className="truncate text-xs font-normal text-text-muted">{tenant.domain}</p>
            </div>
          </div>
        ),
      },
      {
        key: "domain",
        header: "Domain",
        sortable: true,
        sortValue: (tenant) => tenant.domain,
        render: (tenant) => (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-main bg-surface-soft px-2.5 py-1 text-xs font-medium text-text-muted">
            <Globe className="h-3 w-3 shrink-0" />
            {tenant.domain}
          </span>
        ),
      },
      {
        key: "user_count",
        header: "Users",
        sortable: true,
        sortValue: (tenant) => tenant.user_count,
        render: (tenant) => (
          <span className="inline-flex items-center gap-1.5 font-semibold text-text-main">
            <Users className="h-3.5 w-3.5 text-brand" />
            {tenant.user_count.toLocaleString()}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        sortValue: (tenant) => new Date(tenant.created_at),
        render: (tenant) => (
          <span className="font-medium text-text-muted">
            {new Date(tenant.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (tenant) => <StatusBadge active={tenant.is_active !== false} />,
      },
      {
        key: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (tenant) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-text-muted hover:bg-surface-soft hover:text-text-main"
                  disabled={deletingId === tenant.id || togglingId === tenant.id}
                  aria-label={`Actions for ${tenant.name}`}
                />
              }
            >
              {deletingId === tenant.id || togglingId === tenant.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreVertical className="size-4" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem className="cursor-pointer" onClick={() => openEditModal(tenant)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              {tenant.is_active !== false ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleToggleStatus(tenant)}
                >
                  <Ban className="size-4" />
                  Disable
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleToggleStatus(tenant)}
                >
                  <ShieldCheck className="size-4" />
                  Enable
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => handleDelete(tenant)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [deletingId, togglingId],
  );

  const showingLabel =
    filteredTenants.length === 0
      ? "No organizations found"
      : `Showing ${startIndex}-${endIndex} of ${filteredTenants.length} organizations`;

  return (
    <div className="mx-auto max-w-350 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-[28px]">
            Organizations
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage all schools and workspaces registered on the platform.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="px-5 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat, idx) => {
          const Icon = kpiIcons[idx];
          return (
            <div key={stat.title} className="dashboard-card p-5">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                  style={{
                    backgroundColor: stat.color,
                    boxShadow: `0 4px 14px -2px ${stat.color}55`,
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text-muted">{stat.title}</p>
                  <p className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight text-text-main">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {actionError && (
        <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-text-main">All Organizations</h2>
            <p className="mt-0.5 text-xs text-text-muted">{showingLabel}</p>
          </div>
          <div className="w-full sm:w-72">
            <Input
              type="search"
              name="organization_search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, domain, or users..."
              leftIcon={<Search className="h-4 w-4" />}
              className="rounded-md py-2.5 text-sm"
            />
          </div>
        </div>

        {statsLoading && !tenantData ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-muted">Loading organizations...</p>
          </div>
        ) : filteredTenants.length > 0 ? (
          <>
            <Table columns={columns} data={paginatedItems} rowKey={(tenant) => tenant.id} />
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-brand-soft text-brand">
              <Building2 className="h-7 w-7" />
            </div>
            <h4 className="mb-1 text-base font-semibold text-text-main">
              {tenants.length === 0 ? "No Organizations Yet" : "No Matches Found"}
            </h4>
            <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
              {tenants.length === 0
                ? "No organization registrations exist yet. Create your first tenant to get started."
                : "No organizations match your search. Try a different keyword."}
            </p>
            {tenants.length === 0 && (
              <Button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="px-5 py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Organization
              </Button>
            )}
          </div>
        )}
      </div>

      <AddOrganizationModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={refreshStats}
      />

      <EditOrganizationModal
        open={editModalOpen}
        organization={editingTenant}
        onOpenChange={handleEditOpenChange}
        onSuccess={refreshStats}
      />
    </div>
  );
}
