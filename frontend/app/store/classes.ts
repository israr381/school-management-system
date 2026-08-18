import { API_BASE_URL } from "./config";

export interface SchoolClass {
  id: number;
  name: string;
  description: string | null;
  section_count: number;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface SchoolSection {
  id: number;
  name: string;
  class_id: number;
  class_name: string;
  student_count: number;
  created_at: string;
  updated_at: string;
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

const classesCache = createListCache<SchoolClass>();
const sectionsCache = createListCache<SchoolSection>();

async function parseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  throw new Error(data.detail || fallback);
}

async function requestClasses(token: string): Promise<SchoolClass[]> {
  const response = await fetch(`${API_BASE_URL}/classes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load classes.");
  }
  return data;
}

async function requestSections(token: string): Promise<SchoolSection[]> {
  const response = await fetch(`${API_BASE_URL}/sections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load sections.");
  }
  return data;
}

export async function fetchClasses(
  token: string,
  options?: { force?: boolean },
): Promise<SchoolClass[]> {
  return classesCache.get(token, () => requestClasses(token), options?.force);
}

export async function fetchSections(
  token: string,
  options?: { force?: boolean },
): Promise<SchoolSection[]> {
  return sectionsCache.get(token, () => requestSections(token), options?.force);
}

export async function createClass(
  token: string,
  payload: { name: string; description?: string | null },
): Promise<SchoolClass> {
  const response = await fetch(`${API_BASE_URL}/classes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to create class.");
  }
  classesCache.invalidate();
  return data;
}

export async function updateClass(
  token: string,
  classId: number,
  payload: { name: string; description?: string | null },
): Promise<SchoolClass> {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update class.");
  }
  classesCache.invalidate();
  sectionsCache.invalidate();
  return data;
}

export async function deleteClass(token: string, classId: number) {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete class.");
  }
  classesCache.invalidate();
  sectionsCache.invalidate();
}

export async function createSection(
  token: string,
  payload: { name: string; class_id: number },
): Promise<SchoolSection> {
  const response = await fetch(`${API_BASE_URL}/sections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to create section.");
  }
  sectionsCache.invalidate();
  classesCache.invalidate();
  return data;
}

export async function updateSection(
  token: string,
  sectionId: number,
  payload: { name: string; class_id: number },
): Promise<SchoolSection> {
  const response = await fetch(`${API_BASE_URL}/sections/${sectionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update section.");
  }
  sectionsCache.invalidate();
  classesCache.invalidate();
  return data;
}

export async function deleteSection(token: string, sectionId: number) {
  const response = await fetch(`${API_BASE_URL}/sections/${sectionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete section.");
  }
  sectionsCache.invalidate();
  classesCache.invalidate();
}
