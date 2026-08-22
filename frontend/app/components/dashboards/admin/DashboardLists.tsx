import { ClipboardCheck, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router";
import Button from "../../button/Button";
import StudentAvatar from "./StudentAvatar";
import { formatAttendanceDate } from "../../attendance/attendanceUtils";
import type {
  AdminRecentClassDay,
  AdminRecentStudent,
  AdminTopStudent,
} from "../../../store/dashboard";

function formatCreatedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentClassAttendanceCard({ days }: { days: AdminRecentClassDay[] }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Recent Class Attendance</h3>
      {days.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Attendance will appear here after it has been taken.
        </p>
      ) : (
        <ul className="flex-1 space-y-5">
          {days.map((item) => (
            <li
              key={`${item.attendance_date}-${item.class_name}-${item.section_name}`}
              className="flex items-start gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <ClipboardCheck className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main">
                  {item.class_name} {item.section_name}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                  {item.present_count} present · {item.absent_count} absent · {item.late_count} late
                </p>
                <p className="mt-1 text-[11px] text-text-muted/80">
                  {formatAttendanceDate(item.attendance_date)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-success">{item.percent}%</span>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="primary"
        className="mt-6 w-full py-2.5 text-sm"
        onClick={() => navigate("/attendance/students")}
      >
        View student attendance
      </Button>
    </div>
  );
}

export function RecentStudentsCard({ students }: { students: AdminRecentStudent[] }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Recently Added Students</h3>
      {students.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No students have been added yet.</p>
      ) : (
        <ul className="flex-1 space-y-4">
          {students.map((student) => (
            <li key={student.id} className="flex items-start gap-3">
              <span className="shrink-0 text-sm font-bold text-text-main">
                {formatCreatedAt(student.created_at)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main">{student.full_name}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {student.class_name} {student.section_name}
                </p>
              </div>
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-icon-muted" />
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        className="mt-6 w-full py-2.5 text-sm"
        onClick={() => navigate("/students")}
      >
        View all students
      </Button>
    </div>
  );
}

export function TopStudentsCard({ students }: { students: AdminTopStudent[] }) {
  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Top Attendance</h3>
      {students.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Rankings will appear after attendance is recorded.
        </p>
      ) : (
        <ul className="flex-1 space-y-4">
          {students.map((student, index) => (
            <li key={student.id} className="flex items-center gap-3">
              <StudentAvatar
                name={student.full_name}
                avatar={student.avatar_url}
                rank={index + 1}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-main">{student.full_name}</p>
                <p className="text-xs text-text-muted">
                  {student.class_name} {student.section_name} · {student.total_days} days
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-success">
                {student.attendance_percent}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
