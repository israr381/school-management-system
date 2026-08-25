import StudentsPanel from "../components/students/StudentsPanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "Students - School Management" },
    { name: "description", content: "Manage students, classes, and parent accounts." },
  ];
}

export default function StudentsRoute() {
  return (
    <ProtectedRoute
      permission="students.view"
      fallback={
        <AccessRestricted description="You do not have permission to view student records." />
      }
    >
      <StudentsPanel />
    </ProtectedRoute>
  );
}
