import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
} from "lucide-react";
import SchoolIllustration from "./SchoolIllustration";

interface DashboardHeroProps {
  userName: string;
  schoolName: string;
  academicYear: string;
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
}

export default function DashboardHero({
  userName,
  schoolName,
  academicYear,
  totalStudents,
  totalTeachers,
  activeClasses,
}: DashboardHeroProps) {
  const quickStats = [
    { label: "Academic Year", value: academicYear, icon: CalendarDays },
    { label: "Total Students", value: totalStudents.toLocaleString(), icon: GraduationCap },
    { label: "Total Teachers", value: totalTeachers.toLocaleString(), icon: Users },
    { label: "Active Classes", value: activeClasses.toLocaleString(), icon: BookOpen },
  ];

  return (
    <section className="dashboard-hero relative overflow-hidden rounded-[20px] px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[38%] top-6 h-2 w-2 rounded-full bg-yellow-300/70" />
        <div className="absolute right-[42%] top-14 h-1.5 w-1.5 rounded-full bg-pink-300/60" />
        <div className="absolute right-[35%] top-10 h-2.5 w-2.5 rotate-45 rounded-sm bg-cyan-300/50" />
        <div className="absolute right-[30%] bottom-10 h-2 w-2 rounded-full bg-emerald-300/50" />
        <div className="absolute right-[45%] bottom-16 h-1.5 w-1.5 rotate-12 rounded-sm bg-orange-300/60" />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px] lg:text-[32px]">
            Welcome back, {userName} 👋
          </h1>
          <p className="mt-2 text-sm text-white/80 sm:text-base">
            Here&apos;s what&apos;s happening in {schoolName} today.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-[130px] flex-1 rounded-xl border border-white/15 bg-black/20 px-3.5 py-2.5 backdrop-blur-md sm:max-w-[155px] sm:flex-none"
              >
                <div className="flex items-center gap-1.5">
                  <stat.icon className="h-3.5 w-3.5 text-white/70" />
                  <span className="text-[11px] font-medium text-white/70">{stat.label}</span>
                </div>
                <p className="mt-0.5 text-sm font-bold text-white sm:text-[15px]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden shrink-0 lg:block">
          <SchoolIllustration />
        </div>
      </div>
    </section>
  );
}
