import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import type { UserPayload } from "../../../store/user";
import type { ParentDashboardData } from "../../../store/dashboard";
import { formatAttendanceDate } from "../../attendance/attendanceUtils";
import {
  AttendanceTrendCard,
  DashboardKpiGrid,
  EmptyDashboardCard,
  NameAvatar,
  RoleDashboardHero,
  StatusBadge,
} from "../shared/dashboardUi";

interface ParentOverviewProps {
  user: UserPayload;
  orgName: string;
  data: ParentDashboardData;
}

export default function ParentOverview({ user, orgName, data }: ParentOverviewProps) {
  const relationship = data.relationship
    ? data.relationship.charAt(0).toUpperCase() + data.relationship.slice(1)
    : "Parent";

  return (
    <div className="mx-auto max-w-350 space-y-5">
      <RoleDashboardHero
        userName={user.full_name}
        subtitle={`Here's how your ${data.children_count === 1 ? "child is" : "children are"} doing at ${orgName}.`}
        stats={[
          { label: "Children", value: String(data.children_count), icon: GraduationCap },
          { label: "Present Today", value: String(data.today_present), icon: UserCheck },
          { label: "Absent Today", value: String(data.today_absent), icon: UserX },
          {
            label: "Overall Attendance",
            value: `${data.combined_attendance.percent}%`,
            icon: CalendarCheck,
          },
        ]}
      />

      <DashboardKpiGrid
        cards={[
          {
            title: "Children",
            value: data.children_count,
            color: "#6366f1",
            icon: Users,
            subtitle: relationship,
          },
          {
            title: "Present Today",
            value: data.today_present,
            color: "#10b981",
            icon: UserCheck,
          },
          {
            title: "Absent Today",
            value: data.today_absent,
            color: "#ef4444",
            icon: UserX,
          },
          {
            title: "Attendance Rate",
            value: `${data.combined_attendance.percent}%`,
            color: "#3b82f6",
            icon: CalendarCheck,
            subtitle: `${data.combined_attendance.total} records`,
          },
        ]}
      />

      {data.children.length === 0 ? (
        <EmptyDashboardCard
          icon={<GraduationCap className="h-7 w-7" />}
          title="No children linked"
          description="When a student is linked to this parent account, their class and attendance will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            <div className="lg:col-span-2">
              <AttendanceTrendCard title="Children Attendance" points={data.trend} />
            </div>
            <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
              <h3 className="mb-5 text-[15px] font-semibold text-text-main">Today</h3>
              <ul className="flex-1 space-y-4">
                {data.children.map((child) => (
                  <li key={child.id} className="flex items-center gap-3">
                    <NameAvatar name={child.full_name} avatarUrl={child.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-main">{child.full_name}</p>
                      <p className="text-xs text-text-muted">
                        {child.class_name} {child.section_name}
                      </p>
                    </div>
                    <StatusBadge status={child.today_status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
            {data.children.map((child) => (
              <div key={child.id} className="dashboard-card flex h-full flex-col p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <NameAvatar name={child.full_name} avatarUrl={child.avatar_url} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-main">{child.full_name}</p>
                    <p className="text-xs text-text-muted">
                      {child.class_name} {child.section_name}
                    </p>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface-soft px-2 py-3">
                    <p className="text-lg font-bold text-text-main">{child.attendance.percent}%</p>
                    <p className="text-[11px] text-text-muted">Overall</p>
                  </div>
                  <div className="rounded-xl bg-surface-soft px-2 py-3">
                    <p className="text-lg font-bold text-text-main">{child.attendance.present}</p>
                    <p className="text-[11px] text-text-muted">Present</p>
                  </div>
                  <div className="rounded-xl bg-surface-soft px-2 py-3">
                    <p className="text-lg font-bold text-text-main">{child.attendance.absent}</p>
                    <p className="text-[11px] text-text-muted">Absent</p>
                  </div>
                </div>

                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <BookOpen className="h-3.5 w-3.5" />
                  Recent attendance
                </h4>
                {child.recent.length === 0 ? (
                  <p className="text-sm text-text-muted">No attendance recorded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {child.recent.map((row) => (
                      <li key={row.attendance_date} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-text-main">
                          {formatAttendanceDate(row.attendance_date)}
                        </span>
                        <StatusBadge status={row.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
