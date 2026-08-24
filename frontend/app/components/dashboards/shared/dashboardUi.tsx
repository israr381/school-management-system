import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AttendanceStatus } from "../../../store/attendance";
import type { AttendanceTrendPoint } from "../../../store/dashboard";
import SchoolIllustration from "../admin/SchoolIllustration";
import { formatAttendanceDate } from "../../attendance/attendanceUtils";

export function statusStyles(status?: AttendanceStatus | string | null) {
  if (status === "present") return "bg-success-bg text-success border-success-border";
  if (status === "absent") return "bg-danger-bg text-danger border-danger-border";
  if (status === "late") {
    return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300";
  }
  if (status === "leave") {
    return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300";
  }
  return "border-border-main bg-surface-soft text-text-muted";
}

export function statusLabel(status?: AttendanceStatus | string | null) {
  if (!status) return "Not marked";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function StatusBadge({ status }: { status?: AttendanceStatus | string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function NameAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!avatarUrl) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-border-main/60"
        style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      className="h-10 w-10 rounded-full object-cover ring-2 ring-border-main/60"
    />
  );
}

export function DashboardLoading() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-brand/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-brand" />
      </div>
      <p className="text-sm font-medium text-text-muted">Loading your dashboard...</p>
    </div>
  );
}

type HeroStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function RoleDashboardHero({
  userName,
  subtitle,
  stats,
}: {
  userName: string;
  subtitle: string;
  stats: HeroStat[];
}) {
  return (
    <section className="dashboard-hero relative overflow-hidden rounded-[20px] px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[38%] top-6 h-2 w-2 rounded-full bg-yellow-300/70" />
        <div className="absolute right-[42%] top-14 h-1.5 w-1.5 rounded-full bg-pink-300/60" />
        <div className="absolute right-[35%] top-10 h-2.5 w-2.5 rotate-45 rounded-sm bg-cyan-300/50" />
        <div className="absolute right-[30%] bottom-10 h-2 w-2 rounded-full bg-emerald-300/50" />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px] lg:text-[32px]">
            Welcome back, {userName} 👋
          </h1>
          <p className="mt-2 text-sm text-white/80 sm:text-base">{subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
            {stats.map((stat) => (
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

export function DashboardKpiGrid({
  cards,
}: {
  cards: { title: string; value: string | number; color: string; icon: LucideIcon; subtitle?: string }[];
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cards.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
      {cards.map((stat) => {
        const Icon = stat.icon;
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
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
                {stat.subtitle ? (
                  <p className="mt-1 text-[11px] font-medium text-text-muted">{stat.subtitle}</p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildSmoothPath(points: { x: number; y: number }[]) {
  return points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const cpx = (prev.x + point.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function AttendanceTrendCard({
  title,
  points,
}: {
  title: string;
  points: AttendanceTrendPoint[];
}) {
  const width = 560;
  const height = 220;
  const padding = { top: 24, right: 20, bottom: 36, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxY = 100;
  const chartPoints = points.map((item, index) => ({
    x: padding.left + (points.length <= 1 ? chartW / 2 : (index / (points.length - 1)) * chartW),
    y: padding.top + chartH - (item.percent / maxY) * chartH,
    ...item,
  }));
  const highlight =
    [...chartPoints].reverse().find((item) => item.recorded) ?? chartPoints[chartPoints.length - 1];
  const linePath = chartPoints.length ? buildSmoothPath(chartPoints) : "";
  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${padding.top + chartH} L ${chartPoints[0].x} ${padding.top + chartH} Z`
    : "";

  return (
    <div className="dashboard-card p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text-main">{title}</h3>
        <span className="text-xs font-medium text-text-muted">Last 7 days</span>
      </div>
      {chartPoints.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">No attendance data yet.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" aria-label={title}>
          <defs>
            <linearGradient id="roleAttendanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = padding.top + chartH - (tick / maxY) * chartH;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-text-muted text-[11px]">
                  {tick}%
                </text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#roleAttendanceFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chartPoints.map((point) => (
            <g key={point.date}>
              {highlight && point.date === highlight.date ? (
                <>
                  <line
                    x1={point.x}
                    y1={padding.top}
                    x2={point.x}
                    y2={padding.top + chartH}
                    stroke="#6366f1"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.4"
                  />
                  <circle cx={point.x} cy={point.y} r="5" fill="#6366f1" stroke="white" strokeWidth="2.5" />
                  <rect x={point.x - 28} y={point.y - 36} width="56" height="26" rx="6" fill="#0f172a" />
                  <text x={point.x} y={point.y - 18} textAnchor="middle" fill="white" fontSize="12" fontWeight="600">
                    {point.percent}%
                  </text>
                </>
              ) : (
                <circle cx={point.x} cy={point.y} r="3" fill={point.recorded ? "#6366f1" : "#cbd5e1"} />
              )}
              <text x={point.x} y={height - 10} textAnchor="middle" className="fill-text-muted text-[11px] font-medium">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

export function RecentAttendanceCard({
  title,
  records,
  emptyText,
}: {
  title: string;
  records: { attendance_date: string; status: AttendanceStatus; class_name?: string | null; section_name?: string | null }[];
  emptyText: string;
}) {
  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">{title}</h3>
      {records.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{emptyText}</p>
      ) : (
        <ul className="flex-1 space-y-4">
          {records.map((row) => (
            <li key={row.attendance_date} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main">
                  {formatAttendanceDate(row.attendance_date)}
                </p>
                <p className="text-xs text-text-muted">
                  {[row.class_name, row.section_name].filter(Boolean).join(" · ") || "Attendance"}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EmptyDashboardCard({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="dashboard-card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-brand-soft text-brand">
        {icon}
      </div>
      <h4 className="mb-1 text-base font-semibold text-text-main">{title}</h4>
      <p className="mx-auto max-w-sm text-sm text-text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
