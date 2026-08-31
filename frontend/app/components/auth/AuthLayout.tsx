import type { ReactNode } from "react";
import { BarChart3, ClipboardList, GraduationCap } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import loginIllustration from "../../assets/login-illustration.png";

const features = [
  { title: "Student Management", icon: GraduationCap },
  { title: "Attendance Tracking", icon: ClipboardList },
  { title: "Reports & Analytics", icon: BarChart3 },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full text-text-main relative grid grid-cols-1 lg:grid-cols-2">
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <section className="relative hidden lg:flex flex-col justify-between min-h-screen p-8 md:p-12 xl:p-16 bg-surface-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-text-main">School Management</p>
            <p className="text-xs leading-tight text-text-muted">Multi-tenant platform</p>
          </div>
        </div>

        <div className="mt-10 lg:mt-0 space-y-5 max-w-lg">
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Smart School.{" "}
            <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Better Future.
            </span>
          </h1>
          <p className="text-text-muted text-sm md:text-base leading-relaxed">
            Manage students, staff, classes, attendance, exams and much more in one place.
          </p>
        </div>

        <div className="mt-8 lg:mt-0 flex-1 flex items-center justify-center py-8">
          <img
            src={loginIllustration}
            alt="Students at school"
            className="w-full max-w-xl object-contain"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex items-center gap-2.5 rounded-xl bg-panel-bg border border-border-main px-3 py-3"
            >
              <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-text-main leading-snug">{title}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center min-h-screen overflow-y-auto p-6 md:p-10 xl:p-16 bg-app-bg lg:border-l border-border-main">
        <div className="w-full max-w-md bg-panel-bg rounded-3xl border border-border-main shadow-xl shadow-text-main/5 p-6 md:p-8">
          {children}
        </div>
      </section>
    </div>
  );
}
