import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  GraduationCap,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import loginHero from "../../assets/login-hero1.jpg";

const features = [
  { title: "Student Management", icon: Users },
  { title: "Attendance Tracking", icon: CalendarDays },
  { title: "Reports & Analytics", icon: BarChart3 },
  { title: "Secure & Reliable", icon: ShieldCheck },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#eef2ff] text-text-main dark:bg-[#0b1224]">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="login-right-curve" clipPathUnits="objectBoundingBox">
            <path d="M0.10,0 C0.04,0.22 0.02,0.5 0.04,0.72 C0.06,0.88 0.08,0.96 0.10,1 L1,1 L1,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <section className="absolute inset-0 hidden lg:block">
        <img
          src={loginHero}
          alt="Students walking toward school"
          className="bsolute inset-0 right h-full w-fulla object-cover object-[center_10%]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#1e3a8a]/90 via-[#312e81]/55 to-indigo-950/25" />
        <div className="absolute inset-0 bg-linear-to-t from-[#1e1b4b]/80 via-transparent to-[#1e3a8a]/40" />

        <div className="absolute inset-y-0 left-0 z-10 flex w-[58%] flex-col px-12 py-10 xl:px-16 xl:py-12">
          <div className="max-w-135 space-y-9 xl:space-y-11">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-white">
                  School Management
                </p>
                <p className="text-xs leading-tight text-white/70">
                  Multi-tenant platform
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-white xl:text-6xl">
                  Smart School.
                  <span className="mt-1 block bg-linear-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Better Future.
                  </span>
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-white/80 md:text-base">
                  Manage students, staff, classes, attendance, exams and much
                  more in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-8 xl:gap-10">
                {features.map(({ title, icon: Icon }) => (
                  <div
                    key={title}
                    className="flex w-19 flex-col items-center gap-2.5 text-center xl:w-21"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-sky-100 shadow-lg shadow-indigo-950/20 backdrop-blur-md">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-white/90">
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="font-caveat mt-auto max-w-xs text-2xl leading-tight text-white/90 xl:text-[1.7rem]">
            Empowering Education
            <span className="mt-1 block">
              Through Technology
              <svg
                className="mt-1 h-2 w-36 text-sky-300/80"
                viewBox="0 0 144 8"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 5.5C28 1.5 70 1 142 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </p>
        </div>
      </section>

      <section className="relative z-20 flex min-h-screen items-center justify-center px-5 py-10 md:px-8 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[52%] lg:px-10 lg:[clip-path:url(#login-right-curve)] xl:w-[50%] xl:px-12">
        <div className="absolute inset-0 bg-[#eef2ff] dark:bg-[#0b1224]" />
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl dark:bg-indigo-500/20" />
        <div className="pointer-events-none absolute top-1/3 left-10 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl dark:bg-violet-500/15" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl dark:bg-sky-500/10" />

        <div className="absolute top-5 right-5 z-20">
          <ThemeToggle className="rounded-full" />
        </div>

        <div className="relative z-10 w-full min-w-0 lg:ml-1 max-w-112.5">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 p-6 shadow-[0_24px_80px_rgba(79,70,229,0.12)] md:p-8 dark:border-white/12 dark:shadow-[0_24px_80px_rgba(2,6,23,0.55)] dark:ring-1 dark:ring-white/8">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white via-indigo-50 to-violet-50 dark:from-[#121a2e] dark:via-[#0e1630] dark:to-[#1a1238]" />
            <div className="pointer-events-none absolute -top-20 -right-8 h-44 w-44 rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-500/25" />
            <div className="pointer-events-none absolute -bottom-24 -left-4 h-48 w-48 rounded-full bg-violet-300/35 blur-3xl dark:bg-fuchsia-500/15" />
            <div className="relative z-10">
              {children}

              <div className="mt-8 flex items-center gap-3 text-[11px] font-medium text-text-muted">
                <span className="h-px flex-1 bg-border-main dark:bg-white/12" />
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Secure Access
                </span>
                <span className="h-px flex-1 bg-border-main dark:bg-white/12" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
