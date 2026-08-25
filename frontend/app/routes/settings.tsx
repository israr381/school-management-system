import { useOutletContext } from "react-router";
import SettingsPanel from "../components/settings/SettingsPanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";
import type { UserPayload } from "../store/user";

interface SettingsContext {
  user: UserPayload;
  setUser: (user: UserPayload) => void;
}

export function meta() {
  return [
    { title: "Settings - School Management" },
    { name: "description", content: "Manage your account settings." },
  ];
}

export default function SettingsRoute() {
  const { user, setUser } = useOutletContext<SettingsContext>();

  return (
    <ProtectedRoute
      permission="settings.view"
      fallback={
        <AccessRestricted description="You do not have permission to view settings." />
      }
    >
      <SettingsPanel
        user={user}
        onUserChange={(updated) =>
          setUser({
            ...user,
            ...updated,
            organization: updated.organization ?? user.organization,
          })
        }
      />
    </ProtectedRoute>
  );
}
