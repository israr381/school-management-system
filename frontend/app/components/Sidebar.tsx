import {
  Building2,
  CalendarCheck,
  ChevronLeft,
  GraduationCap,
  Home,
  MessageSquare,
  Send,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { usePermission } from "../hooks/usePermission";
import { usePendingRequestCounts } from "../hooks/usePendingRequestCounts";
import { formatPendingCount } from "./requests/requestUtils";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  org: {
    id: number;
    name: string;
    domain: string;
    logo_url?: string | null;
  } | null;
}

const iconStyles: Record<string, string> = {
  "/dashboard": "text-nav-indigo bg-nav-indigo-bg shadow-nav-indigo",
  "/organization": "text-nav-violet bg-nav-violet-bg shadow-nav-violet",
  "/students": "text-nav-cyan bg-nav-cyan-bg shadow-nav-cyan",
  "/teachers": "text-nav-amber bg-nav-amber-bg shadow-nav-amber",
  "/attendance/students": "text-nav-sky bg-nav-sky-bg shadow-nav-sky",
  "/attendance/teachers": "text-nav-violet bg-nav-violet-bg shadow-nav-violet",
  "/attendance/me": "text-nav-sky bg-nav-sky-bg shadow-nav-sky",
  "/requests/me": "text-nav-fuchsia bg-nav-fuchsia-bg shadow-nav-fuchsia",
  "/requests": "text-nav-violet bg-nav-violet-bg shadow-nav-violet",
  "/settings": "text-nav-cyan bg-nav-cyan-bg shadow-nav-cyan",
};

export default function Sidebar({ isCollapsed, setIsCollapsed, org }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { hasPermission } = usePermission();

  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: Home, permission: "dashboard.view" },
    { name: "Organization", path: "/organization", icon: Building2, permission: "organization.view" },
    { name: "Students", path: "/students", icon: GraduationCap, permission: "students.view" },
    { name: "Teachers", path: "/teachers", icon: User, permission: "teachers.view" },
    { name: "Student Attendance", path: "/attendance/students", icon: CalendarCheck, permission: "student_attendance.view" },
    { name: "Teacher Attendance", path: "/attendance/teachers", icon: Users, permission: "teacher_attendance.view" },
    { name: "My Attendance", path: "/attendance/me", icon: CalendarCheck, permission: "my_attendance.view" },
    { name: "My Request", path: "/requests/me", icon: Send, permission: "my_requests.view" },
    { name: "Requests", path: "/requests", icon: MessageSquare, permission: "requests.view" },
    { name: "Settings", path: "/settings", icon: Settings, permission: "settings.view" },
  ];

  const sidebarItems = navigation.filter((item) => hasPermission(item.permission));
  const canViewRequests = hasPermission("requests.view");
  const pendingCounts = usePendingRequestCounts(canViewRequests);
  const pendingCount = pendingCounts.total;

  const isPlatformAdmin = !org;

  return (
    <aside
      className={`relative mr-3 flex shrink-0 flex-col justify-between rounded-xl border border-nav-shell-border bg-sidebar-bg py-4 shadow-sidebar transition-[width] duration-200 ease-out ${
        isCollapsed ? "w-21 px-2.5" : "w-65 px-3.5"
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-0 z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-sidebar-toggle-border bg-sidebar-toggle-bg text-text-muted shadow-sm transition-colors hover:text-text-main lg:flex"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} />
      </button>

      <nav className="space-y-1.5">
        {sidebarItems.map((item) => {
          const isActive =
            item.path === "/settings"
              ? currentPath.startsWith("/settings")
              : currentPath === item.path;
          const Icon = item.icon;
          const colorClass = iconStyles[item.path] ?? iconStyles["/dashboard"];
          const pendingLabel =
            item.path === "/requests" ? formatPendingCount(pendingCount) : "";

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`relative flex w-full cursor-pointer items-center overflow-hidden rounded-xl text-sm font-medium transition-colors duration-200 ease-out ${
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-2.5 py-2"
              } ${
                isActive
                  ? "text-primary-foreground"
                  : "text-text-muted hover:bg-sidebar-hover-bg hover:text-text-main"
              }`}
              title={
                isCollapsed
                  ? pendingLabel
                    ? `${item.name} (${pendingLabel} pending)`
                    : item.name
                  : undefined
              }
            >
              <span
                aria-hidden
                className={`nav-active absolute inset-0 rounded-xl transition-opacity duration-200 ease-out ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />

              <span
                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ease-out ${
                  isActive ? "bg-nav-active-icon-bg text-primary-foreground shadow-none" : colorClass
                }`}
              >
                <Icon className="h-4 w-4" />
                {pendingLabel ? (
                  <span
                    className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                      isActive ? "bg-primary-foreground text-brand" : "bg-danger text-primary-foreground ring-2 ring-sidebar-bg"
                    }`}
                  >
                    {pendingLabel}
                  </span>
                ) : null}
              </span>
              {!isCollapsed && (
                <span
                  className={`relative z-10 min-w-0 flex-1 truncate text-left transition-opacity duration-200 ease-out ${
                    isActive ? "font-semibold opacity-100" : "opacity-90"
                  }`}
                >
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={isCollapsed ? "px-0" : "px-0.5"}>
        {isCollapsed ? (
          <div
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-nav-indigo-bg text-nav-indigo"
            title={isPlatformAdmin ? "Core System" : `Domain: ${org?.domain || "system.local"}`}
          >
            <Building2 className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-footer-border bg-sidebar-footer-bg px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sidebar-mark-bg text-nav-indigo">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                {isPlatformAdmin ? "Environment" : "Domain"}
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-text-main">
                {isPlatformAdmin ? "Multi-tenant Core" : org?.domain || "system.local"}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
