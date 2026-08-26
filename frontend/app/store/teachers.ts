import { API_BASE_URL } from "./config";

export interface Teacher {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  subject?: string | null;
  status: "active" | "disabled" | string;
  avatar_url?: string | null;
  created_at: string;
}

export interface TeacherStats {
  total_teachers: number;
  active_teachers: number;
  disabled_teachers: number;
}

export interface CreateTeacherPayload {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  subject?: string | null;
}

function createCache<T>() {
  let cache: { token: string; data: T } | null = null;
  let inFlight: Promise<T> | null = null;

  return {
    invalidate() {
      cache = null;
      inFlight = null;
    },
    async get(token: string, loader: () => Promise<T>, force = false) {
      if (!force && cache?.token === token) {
        return cache.data;
      }
      if (!force && inFlight) {
        return inFlight;
      }

      const request = loader()
        .then((data) => {
          cache = { token, data };
          return data;
        })
        .finally(() => {
          if (inFlight === request) {
            inFlight = null;
          }
        });

      inFlight = request;
      return request;
    },
  };
}

const teachersCache = createCache<Teacher[]>();
const statsCache = createCache<TeacherStats>();

function invalidateTeacherCaches() {
  teachersCache.invalidate();
  statsCache.invalidate();
}

async function parseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  const detail = data.detail;
  if (typeof detail === "string") {
    throw new Error(detail);
  }
  throw new Error(fallback);
}

async function requestTeachers(token: string): Promise<Teacher[]> {
  const response = await fetch(`${API_BASE_URL}/teachers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load teachers.");
  }
  return data;
}

async function requestTeacherStats(token: string): Promise<TeacherStats> {
  const response = await fetch(`${API_BASE_URL}/teachers/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load teacher stats.");
  }
  return data;
}

export async function fetchTeachers(
  token: string,
  options?: { force?: boolean },
): Promise<Teacher[]> {
  return teachersCache.get(token, () => requestTeachers(token), options?.force);
}

export async function fetchTeacherStats(
  token: string,
  options?: { force?: boolean },
): Promise<TeacherStats> {
  return statsCache.get(token, () => requestTeacherStats(token), options?.force);
}

export async function createTeacher(
  token: string,
  payload: CreateTeacherPayload,
): Promise<Teacher> {
  const response = await fetch(`${API_BASE_URL}/teachers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to create teacher.");
  }
  invalidateTeacherCaches();
  return response.json();
}

export async function updateTeacher(
  token: string,
  teacherId: number,
  payload: CreateTeacherPayload & { status: "active" | "disabled" },
): Promise<Teacher> {
  const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to update teacher.");
  }
  invalidateTeacherCaches();
  return response.json();
}

export async function deleteTeacher(token: string, teacherId: number) {
  const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete teacher.");
  }
  invalidateTeacherCaches();
}
