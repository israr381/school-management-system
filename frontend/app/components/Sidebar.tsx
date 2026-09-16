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
  "/dashboard":
    "text-indigo-500 bg-indigo-50 shadow-[0_0_12px_rgba(99,102,241,0.18)] dark:text-indigo-300 dark:bg-indigo-500/20 dark:shadow-[0_0_16px_rgba(129,140,248,0.35)]",
  "/organization":
    "text-violet-500 bg-violet-50 shadow-[0_0_12px_rgba(139,92,246,0.18)] dark:text-violet-300 dark:bg-violet-500/20 dark:shadow-[0_0_16px_rgba(167,139,250,0.4)]",
  "/students":
    "text-cyan-500 bg-cyan-50 shadow-[0_0_12px_rgba(6,182,212,0.18)] dark:text-cyan-300 dark:bg-cyan-500/20 dark:shadow-[0_0_16px_rgba(34,211,238,0.35)]",
  "/teachers":
    "text-amber-500 bg-amber-50 shadow-[0_0_12px_rgba(245,158,11,0.18)] dark:text-amber-300 dark:bg-amber-500/20 dark:shadow-[0_0_16px_rgba(251,191,36,0.35)]",
  "/attendance/students":
    "text-sky-500 bg-sky-50 shadow-[0_0_12px_rgba(14,165,233,0.18)] dark:text-sky-300 dark:bg-sky-500/20 dark:shadow-[0_0_16px_rgba(56,189,248,0.35)]",
  "/attendance/teachers":
    "text-violet-500 bg-violet-50 shadow-[0_0_12px_rgba(139,92,246,0.18)] dark:text-violet-300 dark:bg-violet-500/20 dark:shadow-[0_0_16px_rgba(167,139,250,0.4)]",
  "/attendance/me":
    "text-sky-500 bg-sky-50 shadow-[0_0_12px_rgba(14,165,233,0.18)] dark:text-sky-300 dark:bg-sky-500/20 dark:shadow-[0_0_16px_rgba(56,189,248,0.35)]",
  "/requests/me":
    "text-fuchsia-500 bg-fuchsia-50 shadow-[0_0_12px_rgba(217,70,239,0.18)] dark:text-fuchsia-300 dark:bg-fuchsia-500/20 dark:shadow-[0_0_16px_rgba(232,121,249,0.35)]",
  "/requests":
    "text-violet-500 bg-violet-50 shadow-[0_0_12px_rgba(139,92,246,0.18)] dark:text-violet-300 dark:bg-violet-500/20 dark:shadow-[0_0_16px_rgba(167,139,250,0.4)]",
  "/settings":
    "text-cyan-500 bg-cyan-50 shadow-[0_0_12px_rgba(6,182,212,0.18)] dark:text-cyan-300 dark:bg-cyan-500/20 dark:shadow-[0_0_16px_rgba(34,211,238,0.35)]",
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
      className={`relative mr-3 flex shrink-0 flex-col justify-between rounded-xl border border-white/10 bg-panel-bg py-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-[width] duration-200 ease-out dark:border-white/8 dark:bg-[#152036] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] ${
        isCollapsed ? "w-[84px] px-2.5" : "w-[260px] px-3.5"
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-0 z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border-main bg-panel-bg text-text-muted shadow-sm transition-colors hover:text-text-main lg:flex dark:border-white/10 dark:bg-[#152036]"
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
                  ? "text-white"
                  : "text-text-muted hover:bg-surface-soft/80 hover:text-text-main dark:hover:bg-white/5"
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
                  isActive ? "bg-white/20 text-white shadow-none" : colorClass
                }`}
              >
                <Icon className="h-4 w-4" />
                {pendingLabel ? (
                  <span
                    className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                      isActive ? "bg-white text-brand" : "bg-danger text-white ring-2 ring-panel-bg dark:ring-[#152036]"
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
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300"
            title={isPlatformAdmin ? "Core System" : `Domain: ${org?.domain || "system.local"}`}
          >
            <Building2 className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border-main/80 bg-surface-soft/80 px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-500 dark:bg-indigo-500/25 dark:text-indigo-300">
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
