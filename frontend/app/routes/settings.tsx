import { useOutletContext } from "react-router";
import SettingsPanel from "../components/settings/SettingsPanel";
import type { UserPayload } from "../store/user";

interface SettingsContext {
  user: UserPayload;
  setUser: (user: UserPayload) => void;
}

export function meta() {
  return [
    { title: "Settings - Opelae School" },
    { name: "description", content: "Manage your account settings." },
  ];
}

export default function SettingsRoute() {
  const { user, setUser } = useOutletContext<SettingsContext>();

  return (
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
  );
}
