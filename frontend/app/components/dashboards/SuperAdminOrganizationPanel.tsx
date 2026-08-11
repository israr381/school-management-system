import { useMemo, useState } from "react";
import { Building2, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteOrganization } from "../../store/organization";
import Button from "../button/Button";
import Input from "../input/Input";
import AddOrganizationModal from "../modals/add-organization/AddOrganizationModal";
import EditOrganizationModal from "../modals/edit-organization/EditOrganizationModal";
import Table, { type TableColumn } from "../table/Table";
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
  refreshStats,
}: SuperAdminOrganizationPanelProps) {
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditModalOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    setEditModalOpen(open);
    if (!open) {
      setEditingTenant(null);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    const confirmed = window.confirm(
      `Delete "${tenant.name}"? This will also remove its users.`
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
    } catch (err: any) {
      setActionError(err.message || "Failed to delete organization.");
    } finally {
      setDeletingId(null);
    }
  };

  const tenants = tenantData?.tenants ?? [];

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;

    return tenants.filter((tenant) => {
      const haystack = [tenant.name, tenant.domain, String(tenant.user_count)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, tenants]);

  const columns = useMemo<TableColumn<Tenant>[]>(
    () => [
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
      {
        key: "actions",
        header: "Action",
        headerClassName: "text-right",
        className: "text-right",
        render: (tenant) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-text-muted hover:text-text-main"
                  disabled={deletingId === tenant.id}
                  aria-label={`Actions for ${tenant.name}`}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => openEditModal(tenant)}
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
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
    [deletingId]
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
          onClick={() => setAddModalOpen(true)}
          className="py-2.5 px-4 rounded-lg text-sm shrink-0"
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
            className="py-2.5 rounded-lg text-sm"
          />
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-sm">
          {actionError}
        </div>
      )}

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
                onClick={() => setAddModalOpen(true)}
                className="py-2.5 px-4 rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
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
