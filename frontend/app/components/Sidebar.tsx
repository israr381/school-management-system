import {
  Building2,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  role: string;
  org: {
    id: number;
    name: string;
    domain: string;
  } | null;
}

const iconColors = [
  "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/15",
  "text-purple-500 bg-purple-50 dark:bg-purple-500/15",
  "text-blue-500 bg-blue-50 dark:bg-blue-500/15",
];

export default function Sidebar({ isCollapsed, setIsCollapsed, role, org }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const sidebarItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Organization", path: "/organization", icon: Building2 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const isSuperAdmin = role === "superadmin";
  const brandName = isSuperAdmin ? "Opelae System" : org?.name || "Opelae School";

  return (
    <aside
      className={`relative flex shrink-0 flex-col justify-between border-r border-border-main bg-panel-bg transition-[width] duration-200 ease-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        <div
          className={`flex h-16 items-center gap-3 border-b border-border-main/80 transition-all duration-200 ease-out ${
            isCollapsed ? "justify-center px-0" : "justify-between px-5"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="select-none">
                <h1 className="text-base font-bold leading-none text-text-main">{brandName}</h1>
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {isSuperAdmin ? "Admin Console" : "School Portal"}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="shrink-0 cursor-pointer rounded-md p-1 text-text-muted transition-colors duration-150 hover:bg-surface-soft hover:text-text-main"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute left-17 z-50 cursor-pointer rounded-full border border-border-main bg-panel-bg p-px shadow-sm transition-transform duration-150 hover:scale-105"
            title="Expand Sidebar"
          >
            <ChevronLeft className="h-4 w-4 rotate-180 text-text-muted" />
          </button>
        )}

        <nav className="space-y-1 p-4">
          {sidebarItems.map((item, index) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            const colorClass = iconColors[index % iconColors.length];

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`relative flex w-full cursor-pointer items-center overflow-hidden rounded-md text-sm font-medium transition-colors duration-200 ease-out ${
                  isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "text-white"
                    : "text-text-muted hover:bg-surface-soft/80 hover:text-text-main"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                {/* Gradient background — fades in/out via opacity */}
                <span
                  aria-hidden
                  className={`nav-active absolute inset-0 rounded-md transition-opacity duration-200 ease-out ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />

                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all duration-200 ease-out ${
                    isActive ? "bg-white/20 text-white" : colorClass
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!isCollapsed && (
                  <span
                    className={`relative z-10 transition-opacity duration-200 ease-out ${
                      isActive ? "font-semibold opacity-100" : "opacity-80"
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border-main/85 p-4">
        {isCollapsed ? (
          <div
            className="flex justify-center text-xs font-bold text-text-muted"
            title={isSuperAdmin ? "Core System" : `Domain: ${org?.domain || "system.local"}`}
          >
            🌐
          </div>
        ) : (
          <div className="rounded-md border border-border-main bg-surface-soft p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {isSuperAdmin ? "Environment" : "Domain"}
            </span>
            <span className="mt-1 block truncate text-xs font-semibold text-brand">
              {isSuperAdmin ? "Multi-tenant Core" : org?.domain || "system.local"}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
