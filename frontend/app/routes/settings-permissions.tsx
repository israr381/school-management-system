import ManagePermissionsPage from "../components/settings/ManagePermissionsPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "Manage Permissions - Opelae School" },
    { name: "description", content: "Assign module permissions to each role." },
  ];
}

export default function SettingsPermissionsRoute() {
  return (
    <ProtectedRoute
      permission="permissions.view"
      fallback={
        <AccessRestricted description="You do not have permission to manage role permissions." />
      }
    >
      <ManagePermissionsPage />
    </ProtectedRoute>
  );
}
