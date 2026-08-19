import { API_BASE_URL } from "./config";

export interface PermissionModule {
  key: string;
  label: string;
  actions: string[];
}

export interface RolePermissions {
  id: number;
  name: string;
  label: string;
  permissions: string[];
}

async function parseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  throw new Error(data.detail || fallback);
}

export async function fetchPermissionCatalog(token: string): Promise<PermissionModule[]> {
  const response = await fetch(`${API_BASE_URL}/permissions/catalog`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load permission catalog.");
  }
  return response.json();
}

export async function fetchRoles(token: string): Promise<RolePermissions[]> {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load roles.");
  }
  return response.json();
}

export async function updateRolePermissions(
  token: string,
  roleId: number,
  permissions: string[],
): Promise<RolePermissions> {
  const response = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ permissions }),
  });
  if (!response.ok) {
    await parseError(response, "Failed to update permissions.");
  }
  return response.json();
}
