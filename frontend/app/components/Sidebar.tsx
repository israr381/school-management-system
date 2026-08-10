import { Building2, ChevronsLeft, LayoutDashboard } from "lucide-react";
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

export default function Sidebar({ isCollapsed, setIsCollapsed, role, org }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const sidebarItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Organization",
      path: "/organization",
      icon: <Building2 className="w-5 h-5" />,
    },
  ];

  const isTabActive = (itemPath: string) => {
    return currentPath === itemPath;
  };

  const isSuperAdmin = role === "superadmin";
  const activeBgClass = isSuperAdmin
    ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
    : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400";

  return (
    <aside
      className={`bg-panel-bg border-r border-border-main flex flex-col justify-between transition-all duration-300 shrink-0 ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      <div>
        <div
          className={`h-16 flex items-center border-b border-border-main/80 gap-3 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : "justify-between px-6"
            }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${isSuperAdmin ? "from-purple-600 to-indigo-600" : "from-blue-600 to-indigo-600"} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}>
              {isSuperAdmin ? "S" : "E"}
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in select-none">
                <h1 className="font-bold text-base leading-none text-text-main">EduManage</h1>
                <span className="text-[10px] text-text-muted font-medium uppercase">
                  {isSuperAdmin ? "System Admin" : "WORKSPACE"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hover:bg-app-bg rounded-lg text-text-muted hover:text-text-main transition-colors p-1.5 shrink-0 ${isCollapsed ? "absolute left-[54px] bg-panel-bg border border-border-main shadow-sm z-50 rounded-full p-1" : ""
              }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronsLeft
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = isTabActive(item.path);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                  } ${isActive
                    ? activeBgClass + " shadow-sm"
                    : "text-text-muted hover:bg-app-bg hover:text-text-main"
                  }`}
                title={isCollapsed ? item.name : undefined}
              >
                {item.icon}
                {!isCollapsed && <span className="animate-fade-in">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border-main/85">
        {isCollapsed ? (
          <div
            className="flex justify-center text-text-muted font-bold text-xs"
            title={isSuperAdmin ? "Core System Panel" : `Domain: ${org?.domain || "system.local"}`}
          >
            {isSuperAdmin ? "⚙️" : "🌐"}
          </div>
        ) : (
          <div className="bg-app-bg p-3.5 rounded-xl border border-border-main flex flex-col gap-1 animate-fade-in">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              {isSuperAdmin ? "Environment" : "Domain"}
            </span>
            <span className={`text-xs font-semibold truncate ${isSuperAdmin ? "text-purple-650 dark:text-purple-400" : "text-text-main"}`}>
              {isSuperAdmin ? "Core System Panel" : (org?.domain || "system.local")}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
