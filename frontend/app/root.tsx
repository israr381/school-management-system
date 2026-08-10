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
import { fetchCurrentUser, clearAuthSession, getAccessToken, isRememberMeEnabled, refreshAccessToken, startTokenRefresh } from "./store/auth";
import { fetchTenantStats } from "./store/organization";
import { ThemeProvider } from "./context/ThemeContext";
import { LogOut } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import Button from "./components/ui/Button";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme');
                const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
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
    const token = getAccessToken();
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
      let token = getAccessToken();

      if (!token && isRememberMeEnabled()) {
        try {
          const refreshed = await refreshAccessToken();
          token = refreshed.access_token;
        } catch {
          clearAuthSession();
          navigate("/login");
          return;
        }
      }

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await fetchCurrentUser(token);
        setUser(data);
        setOrg(data.organization);

        if (isRememberMeEnabled()) {
          startTokenRefresh();
        }

        if (data.role === "superadmin") {
          await fetchTenantData(token);
        }
      } catch (error) {
        if (isRememberMeEnabled()) {
          try {
            const refreshed = await refreshAccessToken();
            const data = await fetchCurrentUser(refreshed.access_token);
            setUser(data);
            setOrg(data.organization);
            startTokenRefresh();
            if (data.role === "superadmin") {
              await fetchTenantData(refreshed.access_token);
            }
            return;
          } catch {
            // fall through to logout
          }
        }
        clearAuthSession();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, isPublicRoute]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setOrg(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-text-muted font-medium animate-pulse">Loading system workspace...</p>
        </div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <Outlet />;
  }

  if (!user) return null;

  const isSuperAdmin = user.role === "superadmin";

  return (
    <div data-role={user.role} className="h-screen overflow-hidden flex bg-app-bg text-text-main transition-colors duration-300 w-full animate-fade-in">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        role={user.role}
        org={org}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-panel-bg border-b border-border-main px-8 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold px-3 py-1.5 rounded-full border bg-role-badge-bg text-role-badge-text border-role-badge-border uppercase tracking-wider">
              {isSuperAdmin ? "System Admin Console" : (org?.name || "System Admin Space")}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-linear-to-tr ${isSuperAdmin ? "from-purple-500 to-indigo-500" : "from-blue-500 to-indigo-500"
                } flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-main leading-none">{user.full_name}</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-role-badge-bg text-role-badge-text">
                    {isSuperAdmin ? "super admin" : user.role.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted mt-1.5 truncate max-w-37.5">{user.email}</span>
              </div>
            </div>

            <div className="w-px h-6 bg-border-main" />

            <ThemeToggle />

            <div className="w-px h-6 bg-border-main" />

            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="w-4.5 h-4.5" />
              Logout
            </Button>
          </div>
        </header>

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
