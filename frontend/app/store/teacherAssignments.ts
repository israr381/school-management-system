import { API_BASE_URL } from "./config";

export interface TeacherClassAssignment {
  id: number;
  teacher_id: number;
  teacher_name: string;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  created_at: string;
  updated_at: string;
}

export interface SaveTeacherAssignmentPayload {
  teacher_id: number;
  class_id: number;
  section_id: number;
}

function createListCache<T>() {
  let cache: { token: string; data: T[] } | null = null;
  let inFlight: Promise<T[]> | null = null;

  return {
    invalidate() {
      cache = null;
      inFlight = null;
    },
    async get(token: string, loader: () => Promise<T[]>, force = false) {
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

const assignmentsCache = createListCache<TeacherClassAssignment>();

async function parseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  const detail = data.detail;
  if (typeof detail === "string") {
    throw new Error(detail);
  }
  throw new Error(fallback);
}

async function requestTeacherAssignments(token: string): Promise<TeacherClassAssignment[]> {
  const response = await fetch(`${API_BASE_URL}/teacher-assignments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load assignments.");
  }
  return data;
}

export async function fetchTeacherAssignments(
  token: string,
  options?: { force?: boolean },
): Promise<TeacherClassAssignment[]> {
  return assignmentsCache.get(token, () => requestTeacherAssignments(token), options?.force);
}

export type MyTeacherAssignmentResult =
  | { kind: "assignment"; assignment: TeacherClassAssignment }
  | { kind: "admin" }
  | { kind: "unassigned"; message: string };

export async function fetchMyTeacherAssignment(
  token: string,
): Promise<MyTeacherAssignmentResult> {
  const response = await fetch(`${API_BASE_URL}/teacher-assignments/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) {
    return { kind: "admin" };
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 400) {
    return {
      kind: "unassigned",
      message: typeof data.detail === "string" ? data.detail : "You are not assigned to a class.",
    };
  }
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load assignment.");
  }
  return { kind: "assignment", assignment: data };
}

export async function saveTeacherAssignment(
  token: string,
  payload: SaveTeacherAssignmentPayload,
): Promise<TeacherClassAssignment> {
  const response = await fetch(`${API_BASE_URL}/teacher-assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to save assignment.");
  }
  assignmentsCache.invalidate();
  return response.json();
}

export async function deleteTeacherAssignment(token: string, assignmentId: number) {
  const response = await fetch(`${API_BASE_URL}/teacher-assignments/${assignmentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete assignment.");
  }
  assignmentsCache.invalidate();
}
