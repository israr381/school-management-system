import { API_BASE_URL } from "./config";

export interface StudentParent {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  relationship: "father" | "guardian" | string;
  address?: string | null;
  student_count?: number;
}

export interface Student {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "graduated" | "disabled" | string;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  created_at: string;
  parent: StudentParent;
}

export interface ClassStudentCount {
  class_id: number;
  class_name: string;
  count: number;
}

export interface StudentStats {
  total_students: number;
  active_students: number;
  graduated_students: number;
  disabled_students: number;
  by_class: ClassStudentCount[];
}

export interface CreateStudentPayload {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  class_id: number;
  section_id: number;
  parent_id?: number;
  parent_full_name?: string;
  parent_email?: string;
  parent_phone?: string;
  parent_relationship?: "father" | "guardian";
  parent_address?: string | null;
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

const studentsCache = createCache<Student[]>();
const parentsCache = createCache<StudentParent[]>();
const statsCache = createCache<StudentStats>();

function invalidateStudentCaches() {
  studentsCache.invalidate();
  parentsCache.invalidate();
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

async function requestStudents(token: string): Promise<Student[]> {
  const response = await fetch(`${API_BASE_URL}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load students.");
  }
  return data;
}

async function requestParents(token: string): Promise<StudentParent[]> {
  const response = await fetch(`${API_BASE_URL}/parents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load parents.");
  }
  return data;
}

async function requestStudentStats(token: string): Promise<StudentStats> {
  const response = await fetch(`${API_BASE_URL}/students/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load student stats.");
  }
  return data;
}

export async function fetchStudents(
  token: string,
  options?: { force?: boolean },
): Promise<Student[]> {
  return studentsCache.get(token, () => requestStudents(token), options?.force);
}

export async function fetchParents(
  token: string,
  options?: { force?: boolean },
): Promise<StudentParent[]> {
  return parentsCache.get(token, () => requestParents(token), options?.force);
}

export async function fetchStudentStats(
  token: string,
  options?: { force?: boolean },
): Promise<StudentStats> {
  return statsCache.get(token, () => requestStudentStats(token), options?.force);
}

export async function createStudent(
  token: string,
  payload: CreateStudentPayload,
): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to create student.");
  }
  invalidateStudentCaches();
  return response.json();
}

export async function updateStudent(
  token: string,
  studentId: number,
  payload: CreateStudentPayload & { status: "active" | "graduated" | "disabled" },
): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to update student.");
  }
  invalidateStudentCaches();
  return response.json();
}

export async function deleteStudent(token: string, studentId: number) {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete student.");
  }
  invalidateStudentCaches();
}
