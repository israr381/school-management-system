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
import Header from "./components/Header";
import { fetchCurrentUser, clearAuthSession, getAccessToken, isRememberMeEnabled, refreshAccessToken, startTokenRefresh } from "./store/auth";
import { fetchTenantStats } from "./store/organization";
import { ThemeProvider } from "./context/ThemeContext";

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
                const preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
                const isDark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
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
    logo_url?: string | null;
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
            <div className="absolute inset-0 rounded-full border-4 border-brand/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-brand animate-spin"></div>
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
        <Header
          user={user}
          isSuperAdmin={isSuperAdmin}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Outlet
            context={{
              user,
              org,
              setOrg,
              tenantData,
              statsLoading,
              refreshStats: handleRefreshStats,
            }}
          />
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
