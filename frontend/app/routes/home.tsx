import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import ThemeToggle from "../components/ThemeToggle";

export function meta() {
  return [
    { title: "EduManage - School & Organization Management" },
    { name: "description", content: "EduManage is a modern school management platform for organizing students, teachers, and classes." },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-linear-to-tr from-app-bg-radial-start to-app-bg-radial-end text-text-main flex flex-col justify-between transition-colors duration-300">

      <header className="h-20 px-8 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            E
          </div>
          <span className="font-bold text-lg tracking-tight">EduManage</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/login"
            className="px-5 py-2.5 bg-text-main text-panel-bg text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl text-center space-y-8 relative">

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-75 h-75 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-role-badge-bg/50 text-role-active-text border border-role-badge-border uppercase tracking-widest">
              ✨ Next-Gen Administration
            </span>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none bg-linear-to-r from-text-main to-text-muted bg-clip-text text-transparent">
              Manage Your School <br />
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Without Limits
              </span>
            </h1>

            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
              A premium, high-level administrative platform built to coordinate students, teachers, and classrooms with absolute clarity. Register your organization to start immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-center"
            >
              Sign In to Console
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto text-left relative">
            {[
              { title: "Organization Domains", desc: "Isolate workspaces by domain." },
              { title: "High-Level UI", desc: "Intuitive premium design." },
              { title: "Fast API Backend", desc: "Powered by FastAPI & PostgreSQL." },
            ].map((feature, idx) => (
              <div key={idx} className="p-5 bg-panel-bg-translucent backdrop-blur-md rounded-2xl border border-border-main/30">
                <h4 className="font-bold text-sm text-text-main">{feature.title}</h4>
                <p className="text-xs text-text-muted mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </main>

      <footer className="py-8 border-t border-border-main text-center text-xs text-text-muted">
        © 2026 EduManage Inc. All rights reserved.
      </footer>

    </div>
  );
}
