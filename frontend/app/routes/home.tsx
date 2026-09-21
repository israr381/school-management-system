import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
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
  Sparkles,
  User,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

export function meta() {
  return [
    { title: "School Management" },
    {
      name: "description",
      content:
        "A refined school console for students, teachers, attendance, leave requests, classes, and security.",
    },
  ];
}

const modules: {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  wide?: boolean;
}[] = [
  {
    title: "Dashboard",
    description: "A live overview of school operations the moment you sign in.",
    icon: LayoutDashboard,
    tone: "from-indigo-500/20 to-violet-500/10 text-indigo-500 dark:text-indigo-300",
    wide: true,
  },
  {
    title: "Organization",
    description: "Schools, domains, logos, and access in one place.",
    icon: Building2,
    tone: "from-violet-500/20 to-fuchsia-500/10 text-violet-500 dark:text-violet-300",
  },
  {
    title: "Students",
    description: "Records, families, class, and section placement.",
    icon: GraduationCap,
    tone: "from-cyan-500/20 to-sky-500/10 text-cyan-500 dark:text-cyan-300",
  },
  {
    title: "Teachers",
    description: "Staff profiles, status, and class assignments.",
    icon: User,
    tone: "from-amber-500/20 to-orange-500/10 text-amber-500 dark:text-amber-300",
  },
  {
    title: "Student Attendance",
    description: "Mark present, absent, late, or leave by class and date.",
    icon: CalendarCheck,
    tone: "from-sky-500/20 to-blue-500/10 text-sky-500 dark:text-sky-300",
  },
  {
    title: "Teacher Attendance",
    description: "Daily staff attendance across the school.",
    icon: Users,
    tone: "from-violet-500/20 to-indigo-500/10 text-violet-500 dark:text-violet-300",
  },
  {
    title: "My Attendance",
    description: "Personal attendance history and daily status.",
    icon: CalendarCheck,
    tone: "from-sky-500/20 to-cyan-500/10 text-sky-500 dark:text-sky-300",
  },
  {
    title: "My Request",
    description: "Submit leave with dates and follow the status.",
    icon: Send,
    tone: "from-fuchsia-500/20 to-pink-500/10 text-fuchsia-500 dark:text-fuchsia-300",
  },
  {
    title: "Requests",
    description: "Review pending leave and keep a clean trail.",
    icon: MessageSquare,
    tone: "from-violet-500/20 to-purple-500/10 text-violet-500 dark:text-violet-300",
  },
  {
    title: "Settings",
    description: "Profile, theme, structure, security, and notifications.",
    icon: Settings,
    tone: "from-cyan-500/20 to-teal-500/10 text-cyan-500 dark:text-cyan-300",
    wide: true,
  },
];

const setupTools: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Classes", description: "The classes students and attendance use.", icon: GraduationCap },
  { title: "Sections", description: "Split a class into groups such as A or B.", icon: LayoutList },
  { title: "Subjects", description: "Attach subjects to a class and section.", icon: BookMarked },
  { title: "Assign Class", description: "Give a teacher a class and section.", icon: UserCheck },
  { title: "Permissions", description: "Decide what each account can open.", icon: Shield },
  { title: "Security", description: "Active devices and sign out others.", icon: Lock },
  { title: "Profile", description: "Name and photo for the signed-in account.", icon: UserRound },
  { title: "Appearance", description: "Light, dark, or system theme.", icon: Palette },
];

const previewNav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Students", icon: GraduationCap },
  { label: "Teachers", icon: User },
  { label: "Attendance", icon: CalendarCheck },
  { label: "Requests", icon: MessageSquare },
  { label: "Settings", icon: Settings },
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
    <div className="min-h-screen overflow-x-hidden bg-app-bg text-text-main">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-brand-soft/70 via-app-bg to-app-bg dark:from-indigo-500/10 dark:via-app-bg dark:to-app-bg" />
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute top-40 right-[-8rem] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-border-main/60 bg-panel-bg/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-btn-primary-from to-btn-primary-to text-white shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-4.5 w-4.5" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">School Management</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-text-muted md:flex">
            <a href="#modules" className="transition-colors hover:text-text-main">
              Modules
            </a>
            <a href="#setup" className="transition-colors hover:text-text-main">
              Setup
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-text-main px-4 py-2 text-sm font-semibold text-panel-bg transition-opacity hover:opacity-90"
            >
              Sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-soft-border bg-panel-bg/80 px-3 py-1 text-xs font-medium text-brand shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Built for daily school work
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-text-main sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              A calm console
              <span className="block bg-linear-to-r from-btn-primary-from to-btn-primary-to bg-clip-text text-transparent">
                for the school day.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-text-muted sm:text-base">
              Students, teachers, attendance, leave, classes, and security — the same workspace you open after sign in, designed with quiet precision.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-linear-to-r from-btn-primary-from to-btn-primary-to px-7 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(79,70,229,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Enter the console
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#modules"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border-main bg-panel-bg/80 px-7 text-sm font-medium text-text-main backdrop-blur-sm transition-colors hover:bg-surface-soft"
              >
                Browse modules
              </a>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-linear-to-br from-indigo-500/20 via-transparent to-violet-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-panel-bg shadow-[0_30px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 border-b border-border-main/80 bg-surface-soft/80 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[11px] font-medium tracking-wide text-text-muted">
                  school-management.app
                </span>
              </div>
              <div className="grid min-h-[22rem] grid-cols-1 md:grid-cols-[13.5rem_1fr]">
                <aside className="hidden border-r border-border-main/80 bg-surface-soft/60 p-3 md:block">
                  <div className="mb-4 flex items-center gap-2 px-2 pt-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-btn-primary-from to-btn-primary-to text-white">
                      <GraduationCap className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-semibold">Workspace</span>
                  </div>
                  <div className="space-y-1">
                    {previewNav.map(({ label, icon: Icon, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] ${
                          active
                            ? "bg-linear-to-r from-btn-primary-from to-btn-primary-to font-semibold text-white shadow-md shadow-indigo-500/20"
                            : "text-text-muted"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </div>
                    ))}
                  </div>
                </aside>
                <div className="space-y-4 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-medium text-text-muted">Today</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight">School overview</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Students", value: "248" },
                      { label: "Present", value: "96%" },
                      { label: "Requests", value: "4" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-border-main/80 bg-surface-soft/80 px-3 py-3"
                      >
                        <p className="text-[11px] text-text-muted">{item.label}</p>
                        <p className="mt-1 text-xl font-semibold tracking-tight">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border-main/80 bg-surface-soft/50 p-4">
                      <p className="text-xs font-medium text-text-muted">Attendance</p>
                      <div className="mt-4 flex h-20 items-end gap-1.5">
                        {[40, 70, 55, 88, 64, 92, 78].map((height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t-md bg-linear-to-t from-indigo-500/20 to-indigo-500"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border-main/80 bg-surface-soft/50 p-4">
                      <p className="text-xs font-medium text-text-muted">Recent activity</p>
                      <div className="mt-3 space-y-2.5">
                        {["Leave reviewed", "Attendance saved", "Class updated"].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modules" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Modules</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">What you work with</h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Each card is a real page in the console. Nothing here is a placeholder.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ title, description, icon: Icon, tone, wide }) => (
              <article
                key={title}
                className={`group relative min-h-[11.5rem] overflow-hidden rounded-3xl border border-border-main/80 bg-panel-bg/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-[0_18px_40px_rgba(79,70,229,0.12)] dark:bg-panel-bg/60 ${
                  wide ? "sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-linear-to-br opacity-60 blur-2xl ${tone}`} />
                <div className={`relative mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="relative text-[15px] font-semibold tracking-tight">{title}</h3>
                <p className="relative mt-2 max-w-md text-sm leading-6 text-text-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="setup" className="scroll-mt-24 border-y border-border-main/80 bg-panel-bg/50">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Setup</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Structure, quietly organized</h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Settings holds the school skeleton and the account controls — classes through appearance.
              </p>
            </div>
            <div className="mt-10 overflow-hidden rounded-3xl border border-border-main/80 bg-panel-bg">
              <div className="grid sm:grid-cols-2">
                {setupTools.map(({ title, description, icon: Icon }, index) => (
                  <div
                    key={title}
                    className={`flex gap-4 p-5 sm:p-6 ${
                      index % 2 === 0 ? "sm:border-r border-border-main/70" : ""
                    } ${index < setupTools.length - 2 ? "border-b border-border-main/70" : ""}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-border-main/70 bg-text-main px-8 py-12 text-panel-bg sm:px-14 sm:py-16">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-400/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready when you are.</h2>
                <p className="mt-3 text-sm leading-7 text-panel-bg/70 sm:text-base">
                  Sign in to the same dashboard, people, attendance, requests, and settings you just saw.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-linear-to-r from-btn-primary-from to-btn-primary-to px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.02]"
              >
                Continue to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-main/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-text-muted sm:flex-row sm:px-8">
          <span>© {new Date().getFullYear()} School Management</span>
          <Link to="/login" className="transition-colors hover:text-text-main">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
