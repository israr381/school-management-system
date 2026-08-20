import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("organization", "routes/organization.tsx"),
  route("students", "routes/students.tsx"),
  route("teachers", "routes/teachers.tsx"),
  route("attendance/students", "routes/student-attendance.tsx"),
  route("attendance/teachers", "routes/teacher-attendance.tsx"),
  route("attendance/me", "routes/my-attendance.tsx"),
  route("settings", "routes/settings.tsx"),
  route("settings/permissions", "routes/settings-permissions.tsx"),
] satisfies RouteConfig;
