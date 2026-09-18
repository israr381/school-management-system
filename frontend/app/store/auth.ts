import { API_BASE_URL } from "./config";
import type { UserPayload } from "./user";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";
const REMEMBER_ME_KEY = "remember_me";
const RBAC_STORAGE_KEY = "rbac-permissions";
const REFRESH_INTERVAL_MS = (9 * 60 + 50) * 60 * 1000;
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
];

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let sessionExpiredHandled = false;
let refreshInFlight: Promise<AuthTokens> | null = null;

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
  localStorage.removeItem(RBAC_STORAGE_KEY);
}

function isPublicRoutePath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/change-password" ||
    pathname === "/"
  );
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function isPublicAuthRequest(url: string) {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export function handleExpiredSession() {
  if (sessionExpiredHandled || typeof window === "undefined") return;
  sessionExpiredHandled = true;

  const pathname = window.location.pathname;
  clearAuthSession();

  if (isPublicRoutePath(pathname)) {
    return;
  }

  window.location.replace("/login");
}

export function installAuthFetchInterceptor() {
  if (typeof window === "undefined") return;

  const browserWindow = window as Window & { __smsOriginalFetch?: typeof fetch };
  const originalFetch = browserWindow.__smsOriginalFetch ?? window.fetch.bind(window);
  browserWindow.__smsOriginalFetch = originalFetch;

  const interceptedFetch: typeof fetch = async (input, init) => {
    const url = requestUrl(input);
    const response = await originalFetch(input, init);

    if (
      response.status !== 401 ||
      !url.startsWith(API_BASE_URL) ||
      isPublicAuthRequest(url)
    ) {
      return response;
    }

    if (url.includes("/auth/refresh") || url.includes("/auth/logout")) {
      if (url.includes("/auth/refresh")) {
        handleExpiredSession();
      }
      return response;
    }

    if (isRememberMeEnabled() && getRefreshToken()) {
      try {
        await refreshSharedAccessToken();
        const retried = await originalFetch(input, withUpdatedAuth(input, init));
        if (retried.status !== 401) {
          return retried;
        }
      } catch {
        handleExpiredSession();
        return response;
      }
    }

    handleExpiredSession();
    return response;
  };

  window.fetch = interceptedFetch;
}

function withUpdatedAuth(input: RequestInfo | URL, init?: RequestInit): RequestInit {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return {
    ...init,
    headers,
  };
}

function refreshSharedAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function persistAuthSession(data: AuthTokens) {
  sessionExpiredHandled = false;
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
      handleExpiredSession();
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

export interface AuthSession {
  id: number;
  device_label: string;
  ip_address?: string | null;
  last_seen_at: string;
  created_at: string;
  is_current: boolean;
}

export async function fetchAuthSessions(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseApiError(data, "Failed to load sessions."));
  }

  return (data.sessions ?? []) as AuthSession[];
}

export async function logoutOtherSessions(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/sessions/logout-others`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseApiError(data, "Failed to sign out other devices."));
  }

  return data as { message: string; revoked_count: number };
}

export async function logoutCurrentSession() {
  const token = getAccessToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Local sign-out should still proceed if the API is unreachable.
    }
  }

  clearAuthSession();
}

if (typeof window !== "undefined") {
  installAuthFetchInterceptor();
}
