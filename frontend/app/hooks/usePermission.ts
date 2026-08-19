import { useRbacStore } from "../store/rbacStore";

export function usePermission() {
  const hasPermission = useRbacStore((state) => state.hasPermission);
  const hasAnyPermission = useRbacStore((state) => state.hasAnyPermission);
  const hasAllPermissions = useRbacStore((state) => state.hasAllPermissions);
  const isLoading = useRbacStore((state) => state.isLoading);
  const permissions = useRbacStore((state) => state.permissions);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    permissions,
  };
}
