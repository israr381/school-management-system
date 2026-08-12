import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CheckCheck,
  ClipboardCheck,
  Megaphone,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type NotificationType = "announcement" | "attendance" | "organization" | "user";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const iconMap: Record<
  NotificationType,
  { icon: typeof Bell; color: string }
> = {
  announcement: {
    icon: Megaphone,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-400",
  },
  attendance: {
    icon: ClipboardCheck,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  organization: {
    icon: Building2,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-500/15 dark:text-purple-400",
  },
  user: {
    icon: UserPlus,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:text-blue-400",
  },
};

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "announcement",
    title: "Parent-Teacher Meeting",
    message: "Scheduled for all grades this Friday at 3:00 PM.",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    type: "attendance",
    title: "Attendance Report Ready",
    message: "Weekly attendance summary is now available.",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    type: "organization",
    title: "New Organization Added",
    message: "Green Valley School joined the platform.",
    time: "3h ago",
    read: false,
  },
  {
    id: "4",
    type: "user",
    title: "New Teacher Registered",
    message: "Sarah Ahmed joined as a Mathematics teacher.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "announcement",
    title: "Holiday Notice",
    message: "School will remain closed on Independence Day.",
    time: "2 days ago",
    read: true,
  },
];

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="relative cursor-pointer rounded-xl border border-transparent p-2.5 text-icon-muted transition-all hover:border-border-main/60 hover:bg-surface-soft hover:text-brand"
            aria-label="Open notifications"
          />
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-panel-bg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 overflow-hidden rounded-2xl border border-border-main/60 p-0 shadow-xl shadow-indigo-500/10 sm:w-96"
      >
        <div className="flex items-center justify-between border-b border-border-main/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">Notifications</p>
              <p className="text-[11px] text-text-muted">
                {unreadCount > 0
                  ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-soft"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-icon-muted">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-text-main">No notifications</p>
              <p className="mt-1 text-xs text-text-muted">
                We'll notify you when something arrives.
              </p>
            </div>
          ) : (
            <DropdownMenuGroup className="p-2">
              {notifications.map((notification) => {
                const { icon: Icon, color } = iconMap[notification.type];

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`mb-1 cursor-pointer rounded-xl px-3 py-3 last:mb-0 ${
                      notification.read
                        ? "opacity-75"
                        : "bg-brand-soft/30 focus:bg-brand-soft/50"
                    }`}
                    onClick={() => markRead(notification.id)}
                  >
                    <div className="flex w-full items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug text-text-main">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-muted">
                          {notification.message}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium text-text-muted/80">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <DropdownMenuGroup className="p-2">
          <DropdownMenuItem className="cursor-pointer justify-center rounded-xl py-2.5 text-center text-sm font-semibold text-brand">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
