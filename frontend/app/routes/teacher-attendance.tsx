import TeacherAttendancePanel from "../components/attendance/TeacherAttendancePanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "Teacher Attendance - Opelae School" },
    { name: "description", content: "Take and review teacher attendance." },
  ];
}

export default function TeacherAttendanceRoute() {
  return (
    <ProtectedRoute
      permission="teacher_attendance.view"
      fallback={
        <AccessRestricted description="You do not have permission to view teacher attendance." />
      }
    >
      <TeacherAttendancePanel />
    </ProtectedRoute>
  );
}
