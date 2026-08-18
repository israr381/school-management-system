import { API_BASE_URL } from "./config";

export interface UserPayload {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  organization_id: number | null;
  must_change_password?: boolean;
  organization?: {
    id: number;
    name: string;
    domain: string;
    logo_url?: string | null;
  } | null;
}

export interface AvatarStagingPayload {
  avatar_url: string;
  avatar_public_id: string;
}

export async function uploadUserAvatarStaging(
  token: string,
  file: File,
): Promise<AvatarStagingPayload> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/user/avatar/staging`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to upload profile photo.");
  }

  return data;
}

export async function commitUserAvatar(
  token: string,
  avatar: { avatar_url: string; avatar_public_id: string } | null,
): Promise<UserPayload> {
  const response = await fetch(`${API_BASE_URL}/user/avatar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(
      avatar
        ? { avatar_url: avatar.avatar_url, avatar_public_id: avatar.avatar_public_id }
        : { avatar_url: null, avatar_public_id: null },
    ),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to save profile photo.");
  }

  return data;
}

export async function discardUserAvatarStaging(
  token: string,
  publicId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/user/avatar/staging?public_id=${encodeURIComponent(publicId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to discard profile photo.");
  }
}
