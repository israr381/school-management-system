import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router";
import { getAccessToken, fetchCurrentUser } from "../../store/auth";
import {
  fetchPermissionCatalog,
  fetchRoles,
  updateRolePermissions,
  type PermissionModule,
  type RolePermissions,
} from "../../store/permissions";
import type { UserPayload } from "../../store/user";
import { permissionKey } from "../../lib/permissions";
import { usePermission } from "../../hooks/usePermission";
import { useRbacStore } from "../../store/rbacStore";
import { toast } from "../toast/toast";
import Button from "../button/Button";
import PermissionGuard from "../auth/PermissionGuard";
import { Switch } from "~/components/ui/switch";
import AccessRestricted from "../AccessRestricted";

interface ManagePermissionsContext {
  user: UserPayload;
  setUser: (user: UserPayload) => void;
}

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  take: "Take",
};

export default function ManagePermissionsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useOutletContext<ManagePermissionsContext>();
  const { hasPermission } = usePermission();
  const canView = hasPermission("permissions.view");
  const canUpdate = hasPermission("permissions.update");

  const [catalog, setCatalog] = useState<PermissionModule[]>([]);
  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;

  const isDirty = useMemo(() => {
    if (!selectedRole) return false;
    const current = [...selectedRole.permissions].sort().join(",");
    const draft = [...draftPermissions].sort().join(",");
    return current !== draft;
  }, [selectedRole, draftPermissions]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [catalogRows, roleRows] = await Promise.all([
          fetchPermissionCatalog(token),
          fetchRoles(token),
        ]);
        if (cancelled) return;
        const visibleRoles = user.organization_id
          ? roleRows.filter((role) => role.name !== "superadmin")
          : roleRows;
        setCatalog(catalogRows);
        setRoles(visibleRoles);
        const initial = visibleRoles[0] ?? null;
        setSelectedRoleId(initial?.id ?? null);
        setDraftPermissions(initial?.permissions ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load permissions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [canView, user.organization_id]);

  const selectRole = (role: RolePermissions) => {
    if (role.id === selectedRoleId) return;
    if (isDirty && !window.confirm("You have unsaved changes. Switch roles anyway?")) {
      return;
    }
    setSelectedRoleId(role.id);
    setDraftPermissions(role.permissions);
  };

  const togglePermission = (moduleKey: string, action: string, enabled: boolean) => {
    const key = permissionKey(moduleKey, action);
    setDraftPermissions((current) => {
      if (enabled) {
        return current.includes(key) ? current : [...current, key];
      }
      return current.filter((item) => item !== key);
    });
  };

  const handleSave = async () => {
    if (!selectedRole || !canUpdate) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication session expired. Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      const catalogKeys = new Set(
        catalog.flatMap((module) =>
          module.actions.map((action) => permissionKey(module.key, action)),
        ),
      );
      const updated = await updateRolePermissions(
        token,
        selectedRole.id,
        draftPermissions.filter((key) => catalogKeys.has(key)),
      );
      setRoles((current) => current.map((role) => (role.id === updated.id ? updated : role)));
      setDraftPermissions(updated.permissions);
      toast.success(`${updated.label} permissions updated.`);

      if (user.role === updated.name) {
        const refreshed = await fetchCurrentUser(token);
        setUser({
          ...user,
          ...refreshed,
          organization: refreshed.organization ?? user.organization,
        });
        await useRbacStore.getState().loadPermissions();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <AccessRestricted description="You do not have permission to manage role permissions." />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      <div className="flex  flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-main"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Manage Permissions</h1>
          <p className="mt-1 text-sm text-text-muted">
            {user.organization_id
              ? "These settings apply only to this organization. Choose a role, then enable or disable the modules and actions it can access."
              : "Choose a role, then enable or disable the default modules and actions. Each organization can customize these independently."}
          </p>
        </div>
        <PermissionGuard permission="permissions.update">
          <Button
            type="button"
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty || !selectedRole}
            className="px-5 py-2.5 text-sm"
          >
            Save changes
          </Button>
        </PermissionGuard>
      </div>

      {loading ? (
        <div className="dashboard-card flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm font-medium text-text-muted">Loading permissions...</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
          <aside className="dashboard-card h-fit w-full shrink-0 self-start overflow-hidden p-2 lg:w-[260px]">
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Roles
            </p>
            <div className="space-y-1">
              {roles.map((role) => {
                const selected = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "bg-brand-soft text-brand"
                        : "text-text-muted hover:bg-surface-soft hover:text-text-main"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        selected ? "bg-brand text-white" : "bg-surface-soft text-text-muted"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{role.label}</span>
                      <span className="block text-[11px] font-medium text-text-muted">
                        {role.permissions.length} permission
                        {role.permissions.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
            {selectedRole ? (
              catalog.map((module) => (
                <div key={module.key} className="dashboard-card p-5">
                  <div className="mb-4">
                    <h3 className="text-[15px] font-semibold text-text-main">{module.label}</h3>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Control what {selectedRole.label} can do in {module.label.toLowerCase()}.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {module.actions.map((action) => {
                      const enabled = draftPermissions.includes(permissionKey(module.key, action));
                      return (
                        <label
                          key={action}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border-main bg-surface-soft px-3 py-3"
                        >
                          <span className="text-sm font-medium text-text-main">
                            {ACTION_LABELS[action] ?? action}
                          </span>
                          <Switch
                            checked={enabled}
                            disabled={!canUpdate || saving}
                            onCheckedChange={(checked) =>
                              togglePermission(module.key, action, Boolean(checked))
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-card px-6 py-16 text-center">
                <p className="text-sm text-text-muted">Select a role to view its permissions.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
