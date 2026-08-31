import { API_BASE_URL } from "./config";
import type { UserPayload } from "./user";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";
const REMEMBER_ME_KEY = "remember_me";
const REFRESH_INTERVAL_MS = (9 * 60 + 50) * 60 * 1000; // 9 hours 50 minutes

let refreshTimer: ReturnType<typeof setInterval> | null = null;

export interface AuthTokens {
  access_token: string;
  token_type?: string;
  refresh_token?: string | null;
  remember_me?: boolean;
  must_change_password?: boolean;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isRememberMeEnabled() {
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

export function clearAuthSession() {
  stopTokenRefresh();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  localStorage.removeItem("remember_email");
}

export function persistAuthSession(data: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);

  if (data.remember_me && data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    localStorage.setItem(REMEMBER_ME_KEY, "true");
    startTokenRefresh();
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem("remember_email");
    stopTokenRefresh();
  }
}

export function stopTokenRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export function startTokenRefresh() {
  stopTokenRefresh();

  if (!isRememberMeEnabled() || !getRefreshToken()) {
    return;
  }

  refreshTimer = setInterval(async () => {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      clearAuthSession();
      window.location.href = "/login";
    }
  }, REFRESH_INTERVAL_MS);
}

export async function loginUser(email: string, password: string, rememberMe = false) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      remember_me: rememberMe,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Authentication failed. Please verify credentials.");
  }

  return data as AuthTokens;
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Session expired. Please log in again.");
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  localStorage.setItem(REMEMBER_ME_KEY, "true");

  return data as AuthTokens;
}

export async function fetchCurrentUser(token: string): Promise<UserPayload> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Session expired. Please log in again.");
  }

  return data as UserPayload;
}

function parseApiError(data: unknown, fallback: string) {
  const detail =
    data && typeof data === "object" && "detail" in data
      ? (data as { detail: unknown }).detail
      : undefined;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

export async function changePassword(
  token: string,
  payload: {
    new_password: string;
    confirm_password: string;
    current_password?: string;
  },
) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseApiError(data, "Failed to update password."));
  }

  return data as { message: string };
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseApiError(data, "Unable to start password reset."));
  }

  return data as { message: string; email: string; reset_token: string };
}

export async function resetPassword(payload: {
  email: string;
  reset_token: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseApiError(data, "Failed to update password."));
  }

  return data as { message: string };
}
