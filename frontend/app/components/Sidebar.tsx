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
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      ) 
    },
    {
      name: "Organization",
      path: "/organization",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      )
    }
  ];

  // Helper to check if a menu path is currently active
  const isTabActive = (itemPath: string) => {
    return currentPath === itemPath;
  };

  // Determine theme colors based on role
  const isSuperAdmin = role === "superadmin";
  const activeBgClass = isSuperAdmin
    ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
    : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400";

  return (
    <aside 
      className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-all duration-300 shrink-0 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div 
          className={`h-16 flex items-center border-b border-gray-100 dark:border-gray-800/80 gap-3 transition-all duration-300 ${
            isCollapsed ? "justify-center px-0" : "justify-between px-6"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${isSuperAdmin ? "from-purple-600 to-indigo-600" : "from-blue-600 to-indigo-600"} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}>
              {isSuperAdmin ? "S" : "E"}
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in select-none">
                <h1 className="font-bold text-base leading-none text-gray-900 dark:text-white">EduManage</h1>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase">
                  {isSuperAdmin ? "System Admin" : "WORKSPACE"}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1.5 shrink-0 ${
              isCollapsed ? "absolute left-[54px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm z-50 rounded-full p-1" : ""
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = isTabActive(item.path);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? activeBgClass + " shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
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

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800/80">
        {isCollapsed ? (
          <div 
            className="flex justify-center text-gray-450 dark:text-gray-500 font-bold text-xs" 
            title={isSuperAdmin ? "Core System Panel" : `Domain: ${org?.domain || "system.local"}`}
          >
            {isSuperAdmin ? "⚙️" : "🌐"}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-900 flex flex-col gap-1 animate-fade-in">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
              {isSuperAdmin ? "Environment" : "Domain"}
            </span>
            <span className={`text-xs font-semibold truncate ${isSuperAdmin ? "text-purple-650 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"}`}>
              {isSuperAdmin ? "Core System Panel" : (org?.domain || "system.local")}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
