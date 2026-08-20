import MyAttendancePanel from "../components/attendance/MyAttendancePanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "My Attendance - Opelae School" },
    { name: "description", content: "View your attendance history." },
  ];
}

export default function MyAttendanceRoute() {
  return (
    <ProtectedRoute
      permission="my_attendance.view"
      fallback={
        <AccessRestricted description="You do not have permission to view your attendance." />
      }
    >
      <MyAttendancePanel />
    </ProtectedRoute>
  );
}
