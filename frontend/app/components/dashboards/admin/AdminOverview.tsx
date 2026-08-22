import {
  ClipboardCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import DashboardHero from "./DashboardHero";
import { AttendanceOverviewCard, ClassDistributionCard } from "./DashboardCharts";
import {
  RecentClassAttendanceCard,
  RecentStudentsCard,
  TopStudentsCard,
} from "./DashboardLists";
import type { AdminDashboardData } from "../../../store/dashboard";
import type { UserPayload } from "../../../store/user";

interface AdminOverviewProps {
  user: UserPayload;
  org: UserPayload["organization"];
  data: AdminDashboardData;
}

const kpiIcons = [User, Users, ClipboardCheck, UserCheck];

export default function AdminOverview({ user, org, data }: AdminOverviewProps) {
  const schoolName = org?.name ?? "Opelae School";
  const kpiCards = [
    {
      title: "Total Students",
      value: data.total_students.toLocaleString(),
      subtitle: `${data.active_students} active`,
      color: "#6366f1",
    },
    {
      title: "Total Teachers",
      value: data.total_teachers.toLocaleString(),
      subtitle: `${data.active_teachers} active`,
      color: "#3b82f6",
    },
    {
      title: "Attendance",
      value: `${data.student_attendance.percent}%`,
      subtitle: `${data.student_attendance.total} records`,
      color: "#10b981",
    },
    {
      title: "Present Today",
      value: data.today_student.total ? data.today_student.present.toLocaleString() : "—",
      subtitle: data.today_student.total
        ? `${data.today_student.absent} absent · ${data.today_student.late} late`
        : "Not taken yet",
      color: "#f97316",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <DashboardHero
        userName={user.full_name}
        schoolName={schoolName}
        academicYear={data.academic_year}
        totalStudents={data.total_students}
        totalTeachers={data.total_teachers}
        activeClasses={data.active_classes}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat, idx) => {
          const Icon = kpiIcons[idx];
          return (
            <div key={stat.title} className="dashboard-card p-5">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                  style={{
                    backgroundColor: stat.color,
                    boxShadow: `0 4px 14px -2px ${stat.color}55`,
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text-muted">{stat.title}</p>
                  <p className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight text-text-main">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-text-muted">{stat.subtitle}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="flex lg:col-span-2">
          <AttendanceOverviewCard points={data.trend} />
        </div>
        <div className="flex lg:col-span-1">
          <ClassDistributionCard items={data.by_class} totalStudents={data.total_students} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
        <RecentClassAttendanceCard days={data.recent_class_days} />
        <RecentStudentsCard students={data.recent_students} />
        <TopStudentsCard students={data.top_students} />
      </div>
    </div>
  );
}
