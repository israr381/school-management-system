import { API_BASE_URL } from "./config";
import type { AttendanceStatus } from "./attendance";

export interface AttendanceTotals {
  total: number;
  present: number;
  absent: number;
  late: number;
  percent: number;
}

export interface AttendanceTrendPoint {
  date: string;
  label: string;
  percent: number;
  recorded: boolean;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface DashboardAttendanceRecord {
  attendance_date: string;
  status: AttendanceStatus;
  class_name?: string | null;
  section_name?: string | null;
}

export interface DashboardStudentCard {
  id: number;
  full_name: string;
  status: string;
  class_name: string;
  section_name: string;
  avatar_url?: string | null;
  today_status?: AttendanceStatus | null;
  attendance: AttendanceTotals;
  recent: DashboardAttendanceRecord[];
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  parent_relationship?: string | null;
}

export interface TeacherClassDaySummary {
  attendance_date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  percent: number;
}

export interface TeacherDashboardData {
  assigned: boolean;
  teacher_id?: number | null;
  subject?: string | null;
  class_id?: number | null;
  class_name?: string | null;
  section_id?: number | null;
  section_name?: string | null;
  student_count: number;
  today_taken: boolean;
  today_status?: AttendanceStatus | null;
  today_class: AttendanceTotals;
  class_attendance: AttendanceTotals;
  my_attendance: AttendanceTotals;
  trend: AttendanceTrendPoint[];
  students: DashboardStudentCard[];
  recent_class_days: TeacherClassDaySummary[];
  recent_my_attendance: DashboardAttendanceRecord[];
}

export interface StudentDashboardData {
  student_id: number;
  full_name: string;
  status: string;
  class_name: string;
  section_name: string;
  avatar_url?: string | null;
  today_status?: AttendanceStatus | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  parent_relationship: string;
  attendance: AttendanceTotals;
  trend: AttendanceTrendPoint[];
  recent: DashboardAttendanceRecord[];
}

export interface ParentDashboardData {
  parent_id: number;
  full_name: string;
  relationship: string;
  children_count: number;
  today_present: number;
  today_absent: number;
  combined_attendance: AttendanceTotals;
  trend: AttendanceTrendPoint[];
  children: DashboardStudentCard[];
}

export interface AdminClassDistribution {
  class_id: number;
  class_name: string;
  count: number;
  percent: number;
}

export interface AdminTopStudent {
  id: number;
  full_name: string;
  class_name: string;
  section_name: string;
  avatar_url?: string | null;
  attendance_percent: number;
  total_days: number;
}

export interface AdminRecentStudent {
  id: number;
  full_name: string;
  class_name: string;
  section_name: string;
  created_at: string;
  avatar_url?: string | null;
}

export interface AdminRecentClassDay {
  attendance_date: string;
  class_name: string;
  section_name: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  total_students: number;
  percent: number;
}

export interface AdminDashboardData {
  academic_year: string;
  total_students: number;
  active_students: number;
  total_teachers: number;
  active_teachers: number;
  total_parents: number;
  active_classes: number;
  today_student: AttendanceTotals;
  student_attendance: AttendanceTotals;
  today_teacher: AttendanceTotals;
  teacher_attendance: AttendanceTotals;
  trend: AttendanceTrendPoint[];
  by_class: AdminClassDistribution[];
  top_students: AdminTopStudent[];
  recent_students: AdminRecentStudent[];
  recent_class_days: AdminRecentClassDay[];
}

export interface RoleDashboardResponse {
  role: "admin" | "teacher" | "student" | "parent";
  admin?: AdminDashboardData | null;
  teacher?: TeacherDashboardData | null;
  student?: StudentDashboardData | null;
  parent?: ParentDashboardData | null;
}

export async function fetchRoleDashboard(token: string): Promise<RoleDashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Failed to load dashboard.");
  }
  return data;
}
