import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  Bell,
  BookMarked,
  Building2,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  LayoutList,
  Lock,
  MessageSquare,
  Palette,
  Send,
  Settings,
  Shield,
  User,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import loginIllustration from "../assets/login-illustration.png";

export function meta() {
  return [
    { title: "School Management" },
    {
      name: "description",
      content:
        "A multi-tenant school platform for dashboards, students, teachers, attendance, leave requests, classes, and security.",
    },
  ];
}

const modules: {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    title: "Dashboard",
    description: "Role-based overviews for super admins, school admins, teachers, students, and parents.",
    icon: LayoutDashboard,
    tone: "text-indigo-500 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/20",
  },
  {
    title: "Organization",
    description: "Manage school tenants, domains, logos, and active access from one platform console.",
    icon: Building2,
    tone: "text-violet-500 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/20",
  },
  {
    title: "Students",
    description: "Create student records, attach parents, and place each student in a class and section.",
    icon: GraduationCap,
    tone: "text-cyan-500 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/20",
  },
  {
    title: "Teachers",
    description: "Maintain teacher profiles and keep staff status, contact details, and assignments current.",
    icon: User,
    tone: "text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/20",
  },
  {
    title: "Student Attendance",
    description: "Mark present, absent, late, or leave for a class and section by date.",
    icon: CalendarCheck,
    tone: "text-sky-500 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/20",
  },
  {
    title: "Teacher Attendance",
    description: "Take and review daily teacher attendance across the organization.",
    icon: Users,
    tone: "text-violet-500 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/20",
  },
  {
    title: "My Attendance",
    description: "Students and teachers can view their own attendance history and daily status.",
    icon: CalendarCheck,
    tone: "text-sky-500 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/20",
  },
  {
    title: "My Request",
    description: "Submit leave requests with dates and reasons, then track approval status.",
    icon: Send,
    tone: "text-fuchsia-500 bg-fuchsia-50 dark:text-fuchsia-300 dark:bg-fuchsia-500/20",
  },
  {
    title: "Requests",
    description: "Admins review pending leave, approve or reject, and keep a complete request trail.",
    icon: MessageSquare,
    tone: "text-violet-500 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/20",
  },
  {
    title: "Settings",
    description: "Profile, appearance, classes, sections, subjects, assignments, security, and notifications.",
    icon: Settings,
    tone: "text-cyan-500 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/20",
  },
];

const setupTools: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { title: "Classes", description: "Create school classes used by students and attendance.", icon: GraduationCap },
  { title: "Sections", description: "Split each class into sections such as A, B, or Morning.", icon: LayoutList },
  { title: "Subjects", description: "Attach subjects to a class and section.", icon: BookMarked },
  { title: "Assign Class", description: "Give a teacher one class and section assignment.", icon: UserCheck },
  { title: "Permissions", description: "Control what each role can view and change in that school.", icon: Shield },
  { title: "Security", description: "See active devices, mark the current session, and sign out others.", icon: Lock },
  { title: "Profile", description: "Update name and avatar for the signed-in account.", icon: UserRound },
  { title: "Appearance", description: "Light, dark, or system theme for the console.", icon: Palette },
];

const roles = [
  { name: "Super Admin", detail: "Platform-wide organizations and tenants" },
  { name: "Admin", detail: "School operations, people, and reviews" },
  { name: "Teacher", detail: "Class, attendance, and own requests" },
  { name: "Student", detail: "Own attendance and leave requests" },
  { name: "Parent", detail: "Child overview and school updates" },
];

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-app-bg text-text-main">
      <header className="sticky top-0 z-30 border-b border-border-main/80 bg-panel-bg-translucent backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-btn-primary-from to-btn-primary-to text-white shadow-md shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">School Management</p>
              <p className="text-[11px] leading-tight text-text-muted">Multi-tenant platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-text-main px-4 py-2.5 text-sm font-semibold text-panel-bg shadow-md transition-all hover:opacity-90 active:scale-95"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-16 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute top-20 right-16 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="space-y-7">
              <span className="inline-flex items-center rounded-full border border-role-badge-border bg-role-badge-bg/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-role-active-text">
                Live school console
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                Everything your school already runs,
                <span className="bg-linear-to-r from-btn-primary-from to-btn-primary-to bg-clip-text text-transparent">
                  {" "}
                  in one place.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
                Dashboards, organizations, students, teachers, attendance, leave requests, classes, and session security — the same modules you use after sign-in, presented clearly before you enter the console.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-btn-primary-from to-btn-primary-to px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition-all hover:from-btn-primary-from-hover hover:to-btn-primary-to-hover hover:scale-[1.01] active:scale-[0.99]"
                >
                  Sign in to console
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modules"
                  className="inline-flex items-center justify-center rounded-2xl border border-border-main bg-panel-bg px-7 py-3.5 text-sm font-semibold text-text-main transition-colors hover:bg-surface-soft"
                >
                  See what is included
                </a>
              </div>
              <div className="grid max-w-lg grid-cols-3 gap-3 pt-2">
                {[
                  { value: "5", label: "User roles" },
                  { value: "10", label: "Core modules" },
                  { value: "8", label: "Setup tools" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border-main bg-panel-bg px-3 py-3">
                    <p className="text-xl font-extrabold text-text-main">{item.value}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-text-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[28px] border border-border-main bg-panel-bg p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="mb-4 flex items-center justify-between px-1">
                  <div>
                    <p className="text-sm font-semibold">School console</p>
                    <p className="text-xs text-text-muted">Students, attendance, requests, settings</p>
                  </div>
                  <span className="rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                    In production
                  </span>
                </div>
                <img
                  src={loginIllustration}
                  alt="School management workspace"
                  className="h-auto w-full rounded-2xl object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="modules" className="scroll-mt-24 border-t border-border-main bg-panel-bg">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Console modules</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                The same sections you open after login
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
                These are the live navigation areas in the app today — not placeholders. Each card maps to a real page in the sidebar.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map(({ title, description, icon: Icon, tone }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-border-main bg-surface-soft/80 p-5 transition-colors hover:border-brand/30 hover:bg-brand-soft/40"
                >
                  <span className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border-main">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Settings & setup</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                School structure and account controls
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
                Inside Settings you configure classes, sections, subjects, teacher assignments, profile, theme, notifications, and device sessions.
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {setupTools.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-2xl border border-border-main bg-panel-bg p-4">
                  <Icon className="mb-3 h-4.5 w-4.5 text-brand" />
                  <h3 className="text-sm font-bold">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border-main bg-panel-bg">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Access by role</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Five roles, one platform
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
                  Permissions decide which modules appear. Super admins see every organization. School admins run operations. Teachers, students, and parents only see what they need.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {roles.map((role) => (
                  <div key={role.name} className="flex items-start gap-3 rounded-2xl border border-border-main bg-surface-soft px-4 py-4">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
                      {role.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{role.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{role.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border-main">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div className="overflow-hidden rounded-[28px] border border-border-main bg-linear-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-indigo-500/20 sm:p-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                    <Bell className="h-3.5 w-3.5" />
                    Ready for your school
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Sign in and work in the live console
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-indigo-100 sm:text-base">
                    Open the same Dashboard, Students, Attendance, Requests, and Settings modules you see here. Sign out other devices from Security when you need to lock a session.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue to sign in
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-main py-8 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} School Management. All rights reserved.
      </footer>
    </div>
  );
}
