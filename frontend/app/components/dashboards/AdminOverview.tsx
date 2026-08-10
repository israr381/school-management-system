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

interface AdminOverviewProps {
  user: UserResponse;
  org: UserResponse["organization"];
}

export default function AdminOverview({ user, org }: AdminOverviewProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="relative bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-blue-500/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/4 -translate-y-1/4 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full translate-y-1/2 blur-xl pointer-events-none" />

        <div className="relative max-w-2xl">
          <span className="text-xs uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full text-blue-100">
            Dashboard Workspace
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight">
            Welcome, {user.full_name}!
          </h2>
          <p className="mt-2 text-indigo-100 text-lg">
            You are signed in as an <strong className="text-white font-bold capitalize">{user.role.replace("_", " ")}</strong>{org ? <> for <strong className="text-white font-bold">{org.name}</strong></> : " of the system dashboard"}. Here is your overview.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-indigo-200">
            <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Domain: {org?.domain || "system.local"}
            </span>
            <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
              ID: #{user.id}
            </span>
            <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10 capitalize">
              Role: {user.role.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Students", value: "0", change: "New workspace", icon: "📚", color: "from-blue-500 to-cyan-500" },
          { title: "Active Teachers", value: "0", change: "New workspace", icon: "👨‍🏫", color: "from-indigo-500 to-purple-500" },
          { title: "Classes", value: "0", change: "New workspace", icon: "🏫", color: "from-violet-500 to-pink-500" },
          { title: "System Status", value: "Active", change: "100% Uptime", icon: "⚡", color: "from-emerald-500 to-teal-500" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-panel-bg p-6 rounded-2xl border border-border-main/50 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-border-main transition-all">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-text-muted">{stat.title}</span>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold tracking-tight">{stat.value}</h3>
              <p className="text-xs text-text-muted mt-1 font-medium">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-panel-bg rounded-3xl border border-border-main/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-main flex justify-between items-center bg-app-bg/50">
          <h3 className="font-bold text-lg">Dashboard Details</h3>
          <span className="text-xs text-text-muted">Live Workspace Database</span>
        </div>
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-75">
          <div className="w-16 h-16 rounded-2xl bg-app-bg flex items-center justify-center text-3xl mb-4 border border-border-main">
            📁
          </div>
          <h4 className="font-semibold text-base mb-1">No data available for Dashboard</h4>
          <p className="text-sm text-text-muted max-w-sm">
            This workspace for {org?.name || "School"} was recently initialized. Add elements or invite staff members to see logs and analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
