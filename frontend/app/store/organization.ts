import { API_BASE_URL } from "./config";

export interface OrganizationPayload {
  id: number;
  name: string;
  domain: string;
  logo_url?: string | null;
}

export interface LogoStagingPayload {
  logo_url: string;
  logo_public_id: string;
}

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

export async function createOrganization(token: string, orgData: Record<string, unknown>) {
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

export async function updateOrganization(
  token: string,
  orgData: { name: string; domain: string },
): Promise<OrganizationPayload> {
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

export async function uploadOrganizationLogoStaging(
  token: string,
  file: File,
): Promise<LogoStagingPayload> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/organization/logo/staging`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to upload organization logo.");
  }

  return data;
}

export async function commitOrganizationLogo(
  token: string,
  logo: { logo_url: string; logo_public_id: string } | null,
): Promise<OrganizationPayload> {
  const response = await fetch(`${API_BASE_URL}/organization/logo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(
      logo
        ? { logo_url: logo.logo_url, logo_public_id: logo.logo_public_id }
        : { logo_url: null, logo_public_id: null },
    ),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to save organization logo.");
  }

  return data;
}

export async function discardOrganizationLogoStaging(
  token: string,
  publicId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/organization/logo/staging?public_id=${encodeURIComponent(publicId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to discard organization logo.");
  }
}

export async function updateOrganizationById(
  token: string,
  orgId: number,
  orgData: { name: string; domain: string },
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
