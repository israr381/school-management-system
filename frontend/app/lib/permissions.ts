export function permissionKey(module: string, action: string) {
  return `${module}.${action}`;
}

export function formatRoleLabel(role: string) {
  const labels: Record<string, string> = {
    superadmin: "Super Admin",
    admin: "Admin",
    teacher: "Teacher",
    student: "Student",
    parent: "Parent",
  };
  return labels[role] || role.replaceAll("_", " ");
}
