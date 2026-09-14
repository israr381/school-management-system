import { useEffect, useRef } from "react";
import { GraduationCap, Search } from "lucide-react";
import NotificationDropdown from "./dropdown/notifications/NotificationDropdown";
import UserMenuDropdown from "./dropdown/user-menu/UserMenuDropdown";
import { formatRoleLabel } from "../lib/permissions";

interface HeaderProps {
  user: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
    permissions?: string[];
  };
  isSuperAdmin: boolean;
  onLogout: () => void;
  org: {
    id: number;
    name: string;
    domain: string;
    logo_url?: string | null;
  } | null;
}

export default function Header({ user, isSuperAdmin, onLogout, org }: HeaderProps) {
  const roleLabel = isSuperAdmin ? "Super Admin" : formatRoleLabel(user.role);
  const searchRef = useRef<HTMLInputElement>(null);
  const isPlatformAdmin = !org;
  const brandName = org?.name || formatRoleLabel(user.role);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-panel-bg px-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] lg:px-5 dark:border-white/10 dark:bg-[#152036] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
          {!isPlatformAdmin && org?.logo_url ? (
            <img
              src={org.logo_url}
              alt={`${brandName} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <GraduationCap className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 select-none">
          <h1 className="truncate text-[15px] font-bold leading-none text-text-main">
            {brandName}
          </h1>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {isPlatformAdmin ? "Platform" : "Workspace"}
          </span>
        </div>
      </div>

      <div className="hidden w-full max-w-[540px] min-w-0 md:block">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            ref={searchRef}
            type="search"
            name="global_search"
            placeholder="Search students, teachers, classes..."
            className="h-11 w-full rounded-full border border-border-main/70 bg-surface-soft pl-11 pr-24 text-sm text-text-main placeholder:text-text-muted/70 outline-none transition-colors focus:border-brand/40 focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#0d1728]"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center rounded-lg border border-border-main bg-panel-bg px-2 py-1 text-[10px] font-medium tracking-wide text-text-muted sm:inline-flex dark:border-white/10 dark:bg-white/5">
            Ctrl + K
          </kbd>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-1 lg:gap-2">
        <NotificationDropdown />
        <UserMenuDropdown user={user} roleLabel={roleLabel} onLogout={onLogout} />
      </div>
    </header>
  );
}
