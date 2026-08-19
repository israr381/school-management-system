import type { ReactNode } from "react";
import { usePermission } from "../../hooks/usePermission";

type PermissionMode = "any" | "all";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  mode?: PermissionMode;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function PermissionGuard({
  permission,
  permissions,
  mode = "any",
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission();

  if (isLoading) {
    return null;
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
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
