import type { ReactNode } from "react";
import { usePermission } from "../../hooks/usePermission";
import AccessRestricted from "../AccessRestricted";

type PermissionMode = "any" | "all";

interface ProtectedRouteProps {
  permission?: string;
  permissions?: string[];
  mode?: PermissionMode;
  fallback?: ReactNode;
  children: ReactNode;
}

function RouteLoading() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-brand/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-brand" />
      </div>
      <p className="text-sm font-medium text-text-muted">Checking access...</p>
    </div>
  );
}

export default function ProtectedRoute({
  permission,
  permissions,
  mode = "any",
  fallback,
  children,
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission();

  if (isLoading) {
    return <RouteLoading />;
  }

  const required = permission ? [permission] : (permissions ?? []);
  const allowed =
    required.length === 0
      ? false
      : permission
        ? hasPermission(permission)
        : mode === "all"
          ? hasAllPermissions(required)
          : hasAnyPermission(required);

  if (!allowed) {
    return (
      <>
        {fallback ?? (
          <AccessRestricted description="You do not have permission to access this page." />
        )}
      </>
    );
  }

  return <>{children}</>;
}
