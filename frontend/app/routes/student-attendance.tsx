import StudentAttendancePanel from "../components/attendance/StudentAttendancePanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "Student Attendance - Opelae School" },
    { name: "description", content: "Take and review student attendance." },
  ];
}

export default function StudentAttendanceRoute() {
  return (
    <ProtectedRoute
      permission="student_attendance.view"
      fallback={
        <AccessRestricted description="You do not have permission to view student attendance." />
      }
    >
      <StudentAttendancePanel />
    </ProtectedRoute>
  );
}
