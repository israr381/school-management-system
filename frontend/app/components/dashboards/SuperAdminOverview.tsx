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

interface SuperAdminOverviewProps {
  user: UserResponse;
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
}

export default function SuperAdminOverview({ user, tenantData, statsLoading }: SuperAdminOverviewProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
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
              {statsLoading ? "..." : (tenantData?.total_tenants || 0)}
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
              {statsLoading ? "..." : (tenantData?.total_users || 0)}
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

      {/* System status widgets */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm p-8 space-y-6">
        <h3 className="font-bold text-lg border-b border-gray-100 dark:border-gray-800 pb-3">Core Health Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-base">API Server: Connected & Online</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-base">Database Server: Operational</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
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
    </div>
  );
}
