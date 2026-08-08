import { useState, useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import Sidebar from "./components/Sidebar";
import { fetchCurrentUser } from "./store/auth";
import { fetchTenantStats } from "./store/organization";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  organization: {
    id: number;
    name: string;
    domain: string;
  } | null;
}

interface Tenant {
  id: number;
  name: string;
  domain: string;
  created_at: string;
  user_count: number;
}

interface TenantApiResponse {
  total_tenants: number;
  total_users: number;
  tenants: Tenant[];
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [org, setOrg] = useState<UserResponse["organization"]>(null);
  
  // Superadmin stats data managed at the root layout level
  const [tenantData, setTenantData] = useState<TenantApiResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const isPublicRoute = location.pathname === "/login" || location.pathname === "/";

  const fetchTenantData = async (token: string) => {
    try {
      setStatsLoading(true);
      const data = await fetchTenantStats(token);
      setTenantData(data);
    } catch (err) {
      console.error("Failed to load tenant stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await fetchTenantData(token);
    }
  };

  useEffect(() => {
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await fetchCurrentUser(token);
        setUser(data);
        setOrg(data.organization);

        if (data.role === "superadmin") {
          await fetchTenantData(token);
        }
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, isPublicRoute]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setOrg(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading system workspace...</p>
        </div>
      </div>
    );
  }

  // If public route, just render the child component directly without sidebar layout
  if (isPublicRoute) {
    return <Outlet />;
  }

  if (!user) return null;

  const isSuperAdmin = user.role === "superadmin";

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 w-full animate-fade-in">
      {/* Sidebar Component */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        role={user.role} 
        org={org} 
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${
              isSuperAdmin 
                ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30 uppercase tracking-wider text-xs" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/30"
            }`}>
              {isSuperAdmin ? "System Admin Console" : (org?.name || "System Admin Space")}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* User Profile Badge */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${
                isSuperAdmin ? "from-purple-500 to-indigo-500" : "from-blue-500 to-indigo-500"
              } flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{user.full_name}</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    isSuperAdmin 
                      ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  }`}>
                    {isSuperAdmin ? "super admin" : user.role.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 truncate max-w-[150px]">{user.email}</span>
              </div>
            </div>

            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Child Route Viewport Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet context={{ 
            user, 
            org, 
            setOrg, 
            tenantData, 
            statsLoading, 
            refreshStats: handleRefreshStats 
          }} />
        </main>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
