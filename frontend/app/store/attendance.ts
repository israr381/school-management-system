import { API_BASE_URL } from "./config";

export type AttendanceStatus = "present" | "absent" | "late";

export interface StudentAttendanceRecord {
  student_id: number;
  full_name: string;
  status: AttendanceStatus;
}

export interface StudentAttendanceSheet {
  attendance_date: string;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  locked: boolean;
  is_saved: boolean;
  can_edit: boolean;
  present_count: number;
  absent_count: number;
  late_count: number;
  records: StudentAttendanceRecord[];
}

export interface StudentAttendanceSummary {
  attendance_date: string;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  can_edit: boolean;
}

export interface TeacherAttendanceRecord {
  teacher_id: number;
  full_name: string;
  status: AttendanceStatus;
}

export interface TeacherAttendanceSheet {
  attendance_date: string;
  is_saved: boolean;
  can_edit: boolean;
  present_count: number;
  absent_count: number;
  late_count: number;
  records: TeacherAttendanceRecord[];
}

export interface TeacherAttendanceSummary {
  attendance_date: string;
  total_teachers: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  can_edit: boolean;
}

export interface MyAttendanceRecord {
  attendance_date: string;
  status: AttendanceStatus;
  class_name?: string | null;
  section_name?: string | null;
}

export interface MyAttendance {
  person_type: "student" | "teacher";
  full_name: string;
  records: MyAttendanceRecord[];
}

async function parseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  if (typeof data.detail === "string") {
    throw new Error(data.detail);
  }
  throw new Error(fallback);
}

export async function fetchStudentAttendance(
  token: string,
  params: { attendance_date: string; class_id?: number; section_id?: number },
): Promise<StudentAttendanceSheet> {
  const search = new URLSearchParams({ attendance_date: params.attendance_date });
  if (params.class_id) search.set("class_id", String(params.class_id));
  if (params.section_id) search.set("section_id", String(params.section_id));
  const response = await fetch(`${API_BASE_URL}/student-attendance?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load student attendance.");
  }
  return response.json();
}

export async function saveStudentAttendance(
  token: string,
  payload: {
    attendance_date: string;
    class_id?: number;
    section_id?: number;
    records: { student_id: number; status: AttendanceStatus }[];
  },
): Promise<StudentAttendanceSheet> {
  const response = await fetch(`${API_BASE_URL}/student-attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to save student attendance.");
  }
  return response.json();
}

export async function fetchStudentAttendanceHistory(
  token: string,
): Promise<StudentAttendanceSummary[]> {
  const response = await fetch(`${API_BASE_URL}/student-attendance/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load student attendance history.");
  }
  return response.json();
}

export async function deleteStudentAttendance(
  token: string,
  params: { attendance_date: string; class_id: number; section_id: number },
) {
  const search = new URLSearchParams({
    attendance_date: params.attendance_date,
    class_id: String(params.class_id),
    section_id: String(params.section_id),
  });
  const response = await fetch(`${API_BASE_URL}/student-attendance?${search.toString()}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete student attendance.");
  }
}

export async function fetchTeacherAttendance(
  token: string,
  attendanceDate: string,
): Promise<TeacherAttendanceSheet> {
  const response = await fetch(
    `${API_BASE_URL}/teacher-attendance?attendance_date=${encodeURIComponent(attendanceDate)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    await parseError(response, "Failed to load teacher attendance.");
  }
  return response.json();
}

export async function saveTeacherAttendance(
  token: string,
  payload: { attendance_date: string; records: { teacher_id: number; status: AttendanceStatus }[] },
): Promise<TeacherAttendanceSheet> {
  const response = await fetch(`${API_BASE_URL}/teacher-attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to save teacher attendance.");
  }
  return response.json();
}

export async function fetchTeacherAttendanceHistory(
  token: string,
): Promise<TeacherAttendanceSummary[]> {
  const response = await fetch(`${API_BASE_URL}/teacher-attendance/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load teacher attendance history.");
  }
  return response.json();
}

export async function deleteTeacherAttendance(token: string, attendanceDate: string) {
  const response = await fetch(
    `${API_BASE_URL}/teacher-attendance?attendance_date=${encodeURIComponent(attendanceDate)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) {
    await parseError(response, "Failed to delete teacher attendance.");
  }
}

export async function fetchMyAttendance(token: string): Promise<MyAttendance> {
  const response = await fetch(`${API_BASE_URL}/my-attendance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load your attendance.");
  }
  return response.json();
}
