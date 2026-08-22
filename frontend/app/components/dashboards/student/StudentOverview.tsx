import {
  BookOpen,
  CalendarCheck,
  Clock,
  Phone,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import type { UserPayload } from "../../../store/user";
import type { StudentDashboardData } from "../../../store/dashboard";
import Button from "../../button/Button";
import {
  AttendanceTrendCard,
  DashboardKpiGrid,
  RecentAttendanceCard,
  RoleDashboardHero,
  StatusBadge,
  statusLabel,
} from "../shared/dashboardUi";

interface StudentOverviewProps {
  user: UserPayload;
  orgName: string;
  data: StudentDashboardData;
}

export default function StudentOverview({ user, orgName, data }: StudentOverviewProps) {
  const navigate = useNavigate();
  const classLabel = `${data.class_name} ${data.section_name}`.trim();

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <RoleDashboardHero
        userName={user.full_name}
        subtitle={`Your student overview for ${orgName}.`}
        stats={[
          { label: "Class", value: classLabel || "—", icon: BookOpen },
          {
            label: "Today",
            value: statusLabel(data.today_status),
            icon: CalendarCheck,
          },
          { label: "Attendance", value: `${data.attendance.percent}%`, icon: UserCheck },
          { label: "Days Recorded", value: String(data.attendance.total), icon: Clock },
        ]}
      />

      <DashboardKpiGrid
        cards={[
          {
            title: "Total Days",
            value: data.attendance.total,
            color: "#6366f1",
            icon: CalendarCheck,
          },
          {
            title: "Present",
            value: data.attendance.present,
            color: "#10b981",
            icon: UserCheck,
          },
          {
            title: "Absent",
            value: data.attendance.absent,
            color: "#ef4444",
            icon: UserX,
          },
          {
            title: "Late",
            value: data.attendance.late,
            color: "#f97316",
            icon: Clock,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <AttendanceTrendCard title="My Attendance" points={data.trend} />
        </div>
        <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
          <h3 className="mb-5 text-[15px] font-semibold text-text-main">Today</h3>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-main">{classLabel || "Class"}</p>
              <p className="mt-0.5 text-xs text-text-muted">Current attendance status</p>
            </div>
            <StatusBadge status={data.today_status} />
          </div>
          <Button
            variant="primary"
            className="mt-6 w-full py-2.5 text-sm"
            onClick={() => navigate("/attendance/me")}
          >
            View full attendance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
        <RecentAttendanceCard
          title="Recent Attendance"
          records={data.recent}
          emptyText="Your attendance will appear here after it has been taken."
        />
        <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
          <h3 className="mb-5 text-[15px] font-semibold text-text-main">Parent / Guardian</h3>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-main">{data.parent_name || "Not available"}</p>
              <p className="mt-0.5 text-xs capitalize text-text-muted">
                {data.parent_relationship || "Parent"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex items-center gap-2 text-text-muted">
              <Phone className="h-4 w-4" />
              <span>{data.parent_phone || "No phone on file"}</span>
            </p>
            <p className="truncate text-text-muted">{data.parent_email || "No email on file"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
