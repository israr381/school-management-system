import {
  BookOpen,
  CalendarCheck,
  CalendarOff,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import type { UserPayload } from "../../../store/user";
import type { DashboardStudentCard, ParentDashboardData } from "../../../store/dashboard";
import {
  AttendanceTrendCard,
  DashboardKpiGrid,
  EmptyDashboardCard,
  NameAvatar,
  RecentAttendanceCard,
  RoleDashboardHero,
  StatusBadge,
} from "../shared/dashboardUi";

interface ParentOverviewProps {
  user: UserPayload;
  orgName: string;
  data: ParentDashboardData;
}

function enrollmentLabel(child: DashboardStudentCard) {
  return `${child.class_name} ${child.section_name}`.trim() || "Class not assigned";
}

function ChildDetailPanel({
  child,
  index,
  total,
}: {
  child: DashboardStudentCard;
  index: number;
  total: number;
}) {
  const classLabel = enrollmentLabel(child);
  const statusLabel =
    child.status === "active" ? "Active" : child.status === "disabled" ? "Disabled" : "Graduated";

  return (
    <section className="space-y-4">
      <div className="dashboard-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <NameAvatar name={child.full_name} avatarUrl={child.avatar_url} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold text-text-main">{child.full_name}</h3>
                {total > 1 ? (
                  <span className="rounded-full border border-border-main bg-surface-soft px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                    Child {index + 1} of {total}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-text-muted">
                {classLabel} · {statusLabel}
              </p>
            </div>
          </div>
          <StatusBadge status={child.today_status} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <p className="flex items-center gap-2 truncate text-sm text-text-muted">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{child.email || "No email on file"}</span>
          </p>
          <p className="flex items-center gap-2 truncate text-sm text-text-muted">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">{child.phone || "No phone on file"}</span>
          </p>
          <p className="flex items-center gap-2 truncate text-sm text-text-muted">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{child.address || "No address on file"}</span>
          </p>
        </div>
      </div>

      <DashboardKpiGrid
        cards={[
          {
            title: "Total Days",
            value: child.attendance.total,
            color: "#6366f1",
            icon: CalendarCheck,
          },
          {
            title: "Present",
            value: child.attendance.present,
            color: "#10b981",
            icon: UserCheck,
          },
          {
            title: "Absent",
            value: child.attendance.absent,
            color: "#ef4444",
            icon: UserX,
          },
          {
            title: "Late",
            value: child.attendance.late,
            color: "#f97316",
            icon: Clock,
          },
          {
            title: "Leave",
            value: child.attendance.leave ?? 0,
            color: "#0ea5e9",
            icon: CalendarOff,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <AttendanceTrendCard title={`${child.full_name.split(" ")[0]}'s Attendance`} points={child.trend ?? []} />
        </div>
        <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
          <h3 className="mb-5 text-[15px] font-semibold text-text-main">Today</h3>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-main">{classLabel}</p>
              <p className="mt-0.5 text-xs text-text-muted">Current attendance status</p>
            </div>
            <StatusBadge status={child.today_status} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
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
        </div>
      </div>

      <RecentAttendanceCard
        title="Recent Attendance"
        records={child.recent}
        emptyText="Attendance will appear here after it has been taken."
      />
    </section>
  );
}

export default function ParentOverview({ user, orgName, data }: ParentOverviewProps) {
  const relationship = data.relationship
    ? data.relationship.charAt(0).toUpperCase() + data.relationship.slice(1)
    : "Parent";
  const childWord = data.children_count === 1 ? "child" : "children";
  const todayLate = data.today_late ?? 0;
  const todayLeave = data.today_leave ?? 0;

  return (
    <div className="mx-auto max-w-350 space-y-5">
      <RoleDashboardHero
        userName={user.full_name}
        subtitle={`Here's how your ${childWord} ${data.children_count === 1 ? "is" : "are"} doing at ${orgName}.`}
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
            subtitle: todayLate ? `${todayLate} late` : undefined,
          },
          {
            title: "Absent Today",
            value: data.today_absent,
            color: "#ef4444",
            icon: UserX,
            subtitle: todayLeave ? `${todayLeave} on leave` : undefined,
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
          {data.children.length > 1 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
              <div className="lg:col-span-2">
                <AttendanceTrendCard title="Family Attendance" points={data.trend} />
              </div>
              <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
                <h3 className="mb-5 text-[15px] font-semibold text-text-main">Today</h3>
                <ul className="flex-1 space-y-4">
                  {data.children.map((child) => (
                    <li key={child.id} className="flex items-center gap-3">
                      <NameAvatar name={child.full_name} avatarUrl={child.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-main">{child.full_name}</p>
                        <p className="text-xs text-text-muted">{enrollmentLabel(child)}</p>
                      </div>
                      <StatusBadge status={child.today_status} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              {data.children.length === 1 ? "Child details" : `Child details (${data.children.length})`}
            </h2>
          </div>

          <div className="space-y-8">
            {data.children.map((child, index) => (
              <ChildDetailPanel key={child.id} child={child} index={index} total={data.children.length} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
