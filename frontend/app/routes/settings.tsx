import { useOutletContext } from "react-router";
import SettingsPanel from "../components/settings/SettingsPanel";

interface SettingsContext {
  user: {
    full_name: string;
    email: string;
    role: string;
  };
}

export function meta() {
  return [
    { title: "Settings - EduManage" },
    { name: "description", content: "Manage your account settings." },
  ];
}

export default function SettingsRoute() {
  const { user } = useOutletContext<SettingsContext>();

  return <SettingsPanel user={user} />;
}
