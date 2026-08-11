import { API_BASE_URL } from "./config";

export async function fetchTenantStats(token: string) {
  const response = await fetch(`${API_BASE_URL}/superadmin/tenants`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load tenant statistics.");
  }
  
  return data;
}

export async function createOrganization(token: string, orgData: any) {
  const response = await fetch(`${API_BASE_URL}/superadmin/organizations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orgData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to create organization.");
  }
  
  return data;
}

export async function updateOrganization(token: string, orgData: any) {
  const response = await fetch(`${API_BASE_URL}/organization`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orgData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update organization details.");
  }
  
  return data;
}

export async function updateOrganizationById(
  token: string,
  orgId: number,
  orgData: { name: string; domain: string }
) {
  const response = await fetch(`${API_BASE_URL}/superadmin/organizations/${orgId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orgData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update organization.");
  }

  return data;
}

export async function deleteOrganization(token: string, orgId: number) {
  const response = await fetch(`${API_BASE_URL}/superadmin/organizations/${orgId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to delete organization.");
  }

  return data;
}
