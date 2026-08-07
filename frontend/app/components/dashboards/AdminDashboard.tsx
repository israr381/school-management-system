import { useState } from "react";

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

interface AdminDashboardProps {
  user: UserResponse;
  handleLogout: () => void;
}

export default function AdminDashboard({ user, handleLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const sidebarItems = [
    { name: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { name: "Students", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
    { name: "Teachers", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2-2h-2m-6 0H5m4 0H5m4 4H5m6 0h2m-2 4h4"/></svg> },
    { name: "Classes", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
    { name: "Settings", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 w-full animate-fade-in">
      {/* 1. Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-all duration-300 shrink-0">
        <div>
          {/* Organization logo / Title area */}
          <div className="h-16 px-6 flex items-center border-b border-gray-100 dark:border-gray-800/80 gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              E
            </div>
            <div>
              <h1 className="font-bold text-base leading-none text-gray-900 dark:text-white">EduManage</h1>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">WORKSPACE</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm"
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

        {/* Footer of Sidebar */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800/80">
          <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-900 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Domain</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{user.organization?.domain || "system.local"}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          {/* Header left */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-200/50 dark:border-gray-700/30">
              {user.organization?.name || "System Admin Space"}
            </span>
          </div>

          {/* Header right */}
          <div className="flex items-center gap-5">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{user.full_name}</span>
                  <span className="text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {user.role === "superadmin" ? "super admin" : user.role.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 truncate max-w-[150px]">{user.email}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800" />

            {/* Logout button */}
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

        {/* 3. Dashboard Body Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcoming Banner Card */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-blue-500/10">
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
                  You are signed in as a <strong className="text-white font-bold capitalize">{user.role === "superadmin" ? "super admin" : user.role.replace("_", " ")}</strong>{user.organization ? <> for <strong className="text-white font-bold">{user.organization.name}</strong></> : " of the system dashboard"}. Here is your overview.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-indigo-200">
                  <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Domain: {user.organization?.domain || "system.local"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
                    ID: #{user.id}
                  </span>
                  <span className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg border border-white/10 capitalize">
                    Role: {user.role === "superadmin" ? "super admin" : user.role.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: "Total Students", value: "0", change: "New workspace", icon: "📚", color: "from-blue-500 to-cyan-500" },
                { title: "Active Teachers", value: "0", change: "New workspace", icon: "👨‍🏫", color: "from-indigo-500 to-purple-500" },
                { title: "Classes", value: "0", change: "New workspace", icon: "🏫", color: "from-violet-500 to-pink-500" },
                { title: "System Status", value: "Active", change: "100% Uptime", icon: "⚡", color: "from-emerald-500 to-teal-500" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{stat.title}</span>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-extrabold tracking-tight">{stat.value}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{stat.change}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs content demo */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-lg">{activeTab} Details</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">Live Workspace Database</span>
              </div>
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-3xl mb-4 border border-gray-100 dark:border-gray-800">
                  📁
                </div>
                <h4 className="font-semibold text-base mb-1">No data available for {activeTab}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  This workspace for {user.organization?.name || "System Admin"} was recently initialized. Add elements or invite staff members to see logs and analytics.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
