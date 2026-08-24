import {
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  School,
  UserCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import type { UserPayload } from "../../../store/user";
import type { TeacherDashboardData } from "../../../store/dashboard";
import Button from "../../button/Button";
import { formatAttendanceDate } from "../../attendance/attendanceUtils";
import {
  AttendanceTrendCard,
  DashboardKpiGrid,
  EmptyDashboardCard,
  NameAvatar,
  RecentAttendanceCard,
  RoleDashboardHero,
  StatusBadge,
  statusLabel,
} from "../shared/dashboardUi";

interface TeacherOverviewProps {
  user: UserPayload;
  orgName: string;
  data: TeacherDashboardData;
}

export default function TeacherOverview({ user, orgName, data }: TeacherOverviewProps) {
  const navigate = useNavigate();
  const classLabel = data.assigned
    ? `${data.class_name ?? "Class"} ${data.section_name ?? ""}`.trim()
    : "Not assigned";

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <RoleDashboardHero
        userName={user.full_name}
        subtitle={`Here's your class overview for ${orgName} today.`}
        stats={[
          { label: "Assigned Class", value: classLabel, icon: School },
          { label: "Students", value: String(data.student_count), icon: GraduationCap },
          {
            label: "Today's Class",
            value: data.today_taken ? `${data.today_class.percent}%` : "Not taken",
            icon: ClipboardCheck,
          },
          {
            label: "My Status",
            value: statusLabel(data.today_status),
            icon: UserCheck,
          },
        ]}
      />

      {!data.assigned ? (
        <EmptyDashboardCard
          icon={<BookOpen className="h-7 w-7" />}
          title="No class assigned"
          description="Ask an admin to assign you a class and section. You can still review your own attendance."
          action={
            <Button variant="primary" className="px-5 py-2.5 text-sm" onClick={() => navigate("/attendance/me")}>
              View my attendance
            </Button>
          }
        />
      ) : null}

      <DashboardKpiGrid
        cards={[
          {
            title: "Class Students",
            value: data.student_count,
            color: "#6366f1",
            icon: Users,
            subtitle: data.subject || undefined,
          },
          {
            title: "Present Today",
            value: data.today_taken ? data.today_class.present : "—",
            color: "#10b981",
            icon: UserCheck,
            subtitle: data.today_taken
              ? `${data.today_class.absent} absent${data.today_class.leave ? ` · ${data.today_class.leave} leave` : ""}`
              : "Attendance not taken",
          },
          {
            title: "Class Attendance",
            value: `${data.class_attendance.percent}%`,
            color: "#3b82f6",
            icon: ClipboardCheck,
            subtitle: `${data.class_attendance.total} records`,
          },
          {
            title: "My Attendance",
            value: `${data.my_attendance.percent}%`,
            color: "#f97316",
            icon: CalendarCheck,
            subtitle: `${data.my_attendance.present} present · ${data.my_attendance.late} late`,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <AttendanceTrendCard
            title={data.assigned ? "Class Attendance" : "My Attendance"}
            points={data.trend}
          />
        </div>
        <RecentAttendanceCard
          title="My Recent Attendance"
          records={data.recent_my_attendance}
          emptyText="Your attendance will appear here after it has been taken."
        />
      </div>

      {data.assigned ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="dashboard-card flex h-full flex-col p-5 sm:p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-text-main">Class Roster</h3>
              <Button
                variant="primary"
                className="px-4 py-2 text-sm"
                onClick={() => navigate("/attendance/students")}
              >
                Take attendance
              </Button>
            </div>
            {data.students.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                No students in this class yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {data.students.map((student) => (
                  <li key={student.id} className="flex items-center gap-3">
                    <NameAvatar name={student.full_name} avatarUrl={student.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-main">{student.full_name}</p>
                      <p className="text-xs text-text-muted">
                        {student.class_name} {student.section_name} · {student.attendance.percent}% overall
                      </p>
                    </div>
                    <StatusBadge status={student.today_status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
            <h3 className="mb-5 text-[15px] font-semibold text-text-main">Recent Class Days</h3>
            {data.recent_class_days.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                Class attendance history will appear after you take attendance.
              </p>
            ) : (
              <ul className="flex-1 space-y-4">
                {data.recent_class_days.map((day) => (
                  <li key={day.attendance_date} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        {formatAttendanceDate(day.attendance_date)}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {day.present_count} present · {day.absent_count} absent · {day.late_count} late
                        {day.leave_count ? ` · ${day.leave_count} leave` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-success">{day.percent}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
