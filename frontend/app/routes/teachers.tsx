import TeachersPanel from "../components/teachers/TeachersPanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "Teachers - Opelae School" },
    { name: "description", content: "Manage teachers and their login accounts." },
  ];
}

export default function TeachersRoute() {
  return (
    <ProtectedRoute
      permission="teachers.view"
      fallback={
        <AccessRestricted description="You do not have permission to view teacher records." />
      }
    >
      <TeachersPanel />
    </ProtectedRoute>
  );
}
