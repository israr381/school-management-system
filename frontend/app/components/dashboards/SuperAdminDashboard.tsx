import { useEffect, useState } from "react";

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

interface SuperAdminDashboardProps {
  user: UserResponse;
  handleLogout: () => void;
}

export default function SuperAdminDashboard({ user, handleLogout }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [tenantData, setTenantData] = useState<TenantApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTenantData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch("http://localhost:8000/api/superadmin/tenants", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tenant data");
        }

        const data = await response.json();
        setTenantData(data);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading system stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  const sidebarItems = [
    { name: "Overview", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg> },
    { name: "Tenants", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
    { name: "System Status", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 w-full animate-fade-in">
      {/* 1. Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-all duration-300 shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="h-16 px-6 flex items-center border-b border-gray-100 dark:border-gray-800/80 gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              S
            </div>
            <div>
              <h1 className="font-bold text-base leading-none text-gray-900 dark:text-white">EduManage</h1>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold tracking-wider uppercase">SYSTEM ADMIN</span>
            </div>
          </div>

          {/* Sidebar Nav */}
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800/80">
          <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-900 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Environment</span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">Core System Panel</span>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-full border border-purple-200/50 dark:border-purple-900/30 uppercase tracking-wider text-xs">
              System Admin Console
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{user.full_name}</span>
                  <span className="text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    Super Admin
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 truncate max-w-[150px]">{user.email}</span>
              </div>
            </div>

            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800" />

            {/* Logout */}
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

        {/* Content Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading system tenants...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm max-w-lg mx-auto mt-12">
              <h3 className="font-bold text-base mb-1">System Administration Error</h3>
              <p>{error}</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Welcome card */}
              <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-purple-500/10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/4 -translate-y-1/4 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full translate-y-1/2 blur-xl pointer-events-none" />

                <div className="relative max-w-2xl">
                  <span className="text-xs uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full text-purple-100">
                    System-Wide Controller
                  </span>
                  <h2 className="mt-4 text-4xl font-extrabold tracking-tight">
                    Welcome back, {user.full_name}!
                  </h2>
                  <p className="mt-2 text-purple-100 text-lg">
                    You are logged in as a <strong className="text-white font-bold capitalize">Super Admin</strong> of the entire multi-tenant system. Manage tenants, review database statistics, and inspect performance metrics here.
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Registered Tenants</span>
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
                      {tenantData?.total_tenants || 0}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">Organizations / Schools</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Users Across System</span>
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                      {tenantData?.total_users || 0}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">All User Accounts</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">System Core Health</span>
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="mt-4 flex flex-col justify-end">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                        Operational
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">All services connected</p>
                  </div>
                </div>
              </div>

              {/* Active Tab View */}
              {activeTab === "Overview" && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm p-8 space-y-6">
                  <h3 className="font-bold text-lg border-b border-gray-100 dark:border-gray-800 pb-3">System Metrics Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-base text-gray-700 dark:text-gray-300">Quick Tenants Overview</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This system operates in multi-tenant mode. Each tenant organization is isolated with its domain. Super admins can inspect statistics but do not belong to individual workspaces.
                      </p>
                      <button
                        onClick={() => setActiveTab("Tenants")}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all duration-200"
                      >
                        Inspect All Tenants
                      </button>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-900 space-y-3">
                      <h4 className="font-semibold text-sm">Active System Version</h4>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Framework Version:</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400">FastAPI 0.111+</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Database Backend:</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400">PostgreSQL</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Active Roles:</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400">superadmin, admin</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Tenants" && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                      <h3 className="font-bold text-lg">Tenant Organization Registry</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">List of schools and workspaces created by users</p>
                    </div>
                    <span className="text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full font-bold">
                      {tenantData?.tenants.length || 0} Registered
                    </span>
                  </div>

                  {tenantData && tenantData.tenants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Organization Name</th>
                            <th className="px-6 py-4">Domain</th>
                            <th className="px-6 py-4">Users</th>
                            <th className="px-6 py-4">Created Date</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                          {tenantData.tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/50 transition-colors">
                              <td className="px-6 py-4 font-mono font-medium text-xs text-purple-600 dark:text-purple-400">
                                #{tenant.id}
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                {tenant.name}
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-400">
                                {tenant.domain}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                  👤 {tenant.user_count}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                                {new Date(tenant.created_at).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }) || "Unknown"}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-3xl mx-auto mb-4 border border-gray-100 dark:border-gray-800">
                        🏢
                      </div>
                      <h4 className="font-semibold text-base mb-1">No Tenants Found</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        No organization registrations exist yet. Sign up a new user with an organization name and domain to register.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "System Status" && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm p-8 space-y-6">
                  <h3 className="font-bold text-lg border-b border-gray-100 dark:border-gray-800 pb-3">Core Health Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-base">API Server: Connected</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-base">Database Server: Operational</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-base">Autoseed System: Initialized</span>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-900 space-y-2">
                      <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Environment Variables Check</h4>
                      <div className="flex justify-between text-xs">
                        <span>Database Status:</span>
                        <span className="text-emerald-500 font-bold">Online</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Workspace Mode:</span>
                        <span className="text-indigo-500 font-bold">Multi-tenant (2 Roles)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
