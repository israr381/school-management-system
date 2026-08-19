import { LogOut, Settings, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import UserAvatar from "../../settings/UserAvatar";
import ThemeSelector from "./ThemeSelector";
import PermissionGuard from "../../auth/PermissionGuard";

interface UserMenuDropdownProps {
  user: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  roleLabel: string;
  onLogout: () => void;
}

export default function UserMenuDropdown({
  user,
  roleLabel,
  onLogout,
}: UserMenuDropdownProps) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent p-1.5 transition-all hover:border-border-main/60 hover:bg-surface-soft sm:gap-3 sm:pr-2.5"
            aria-label="Open user menu"
          />
        }
      >
        <UserAvatar
          name={user.full_name}
          avatarUrl={user.avatar_url}
          className="h-9 w-9 text-sm"
        />
        <div className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="truncate text-sm font-semibold leading-none text-text-main">
            {user.full_name}
          </span>
          <span className="mt-1 text-[11px] capitalize text-text-muted">{roleLabel}</span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 overflow-hidden rounded-lg border border-border-main/60 p-0 shadow-xl shadow-indigo-500/10"
      >
        <div className="relative overflow-hidden px-4 pb-4 pt-5">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
          <div className="relative flex items-start gap-3">
            <UserAvatar
              name={user.full_name}
              avatarUrl={user.avatar_url}
              className="h-12 w-12 text-base shadow-lg shadow-indigo-500/30"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-main">{user.full_name}</p>
              <p className="mt-0.5 truncate text-xs text-text-muted">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-soft-border bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                <Shield className="h-3 w-3" />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="p-3">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="mb-2 px-0 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Appearance
            </DropdownMenuLabel>
            <ThemeSelector />
          </DropdownMenuGroup>
        </div>

        <DropdownMenuSeparator className="m-0" />

        <DropdownMenuGroup className="p-2">
          <PermissionGuard permission="settings.view">
            <DropdownMenuItem
              className="cursor-pointer rounded-md px-3 py-2.5"
              onClick={() => navigate("/settings")}
            >
              <Settings className="size-4 text-icon-muted" />
              Account Settings
            </DropdownMenuItem>
          </PermissionGuard>

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer rounded-md px-3 py-2.5"
            onClick={onLogout}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
