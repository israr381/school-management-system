import { Search } from "lucide-react";
import Input from "./input/Input";
import NotificationDropdown from "./dropdown/notifications/NotificationDropdown";
import UserMenuDropdown from "./dropdown/user-menu/UserMenuDropdown";

interface HeaderProps {
  user: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  isSuperAdmin: boolean;
  onLogout: () => void;
}

export default function Header({ user, isSuperAdmin, onLogout }: HeaderProps) {
  const roleLabel = isSuperAdmin ? "Super Admin" : user.role.replace("_", " ");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border-main bg-panel-bg px-4 lg:px-6">
      <div className="mx-auto w-full  flex-1">
        <Input
          type="search"
          name="global_search"
          placeholder="Search students, teachers, classes..."
          leftIcon={<Search className="h-4 w-4" />}
          className="rounded-xl border-border-main bg-surface-soft py-2.5 text-sm focus:border-brand max-w-sm"
        />
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <NotificationDropdown />

        <UserMenuDropdown user={user} roleLabel={roleLabel} onLogout={onLogout} />
      </div>
    </header>
  );
}
