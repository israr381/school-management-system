import type { AdminClassDistribution, AttendanceTrendPoint } from "../../../store/dashboard";

const CLASS_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6"];

function buildSmoothPath(points: { x: number; y: number }[]) {
  return points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }, "");
}

function AttendanceLineChart({ points }: { points: AttendanceTrendPoint[] }) {
  const width = 560;
  const height = 220;
  const padding = { top: 24, right: 20, bottom: 36, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxY = 100;

  if (points.length === 0) {
    return <p className="py-12 text-center text-sm text-text-muted">No attendance recorded yet.</p>;
  }

  const chartPoints = points.map((d, i) => ({
    x: padding.left + (points.length <= 1 ? chartW / 2 : (i / (points.length - 1)) * chartW),
    y: padding.top + chartH - (d.percent / maxY) * chartH,
    ...d,
  }));

  const highlight =
    [...chartPoints].reverse().find((p) => p.recorded) ?? chartPoints[chartPoints.length - 1];
  const linePath = buildSmoothPath(chartPoints);
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${padding.top + chartH} L ${chartPoints[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" aria-label="Weekly attendance chart">
      <defs>
        <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
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

      <path d={areaPath} fill="url(#attendanceFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {chartPoints.map((p) => (
        <g key={p.date}>
          {highlight && p.date === highlight.date ? (
            <>
              <line
                x1={p.x}
                y1={padding.top}
                x2={p.x}
                y2={padding.top + chartH}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.4"
              />
              <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="white" strokeWidth="2.5" />
              <rect x={p.x - 28} y={p.y - 36} width="56" height="26" rx="6" fill="#0f172a" />
              <text x={p.x} y={p.y - 18} textAnchor="middle" fill="white" fontSize="12" fontWeight="600">
                {p.percent}%
              </text>
            </>
          ) : (
            <circle cx={p.x} cy={p.y} r="3" fill={p.recorded ? "#6366f1" : "#cbd5e1"} />
          )}
          <text x={p.x} y={height - 10} textAnchor="middle" className="fill-text-muted text-[11px] font-medium">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ClassDonutChart({
  items,
  totalStudents,
}: {
  items: { class_name: string; count: number; percent: number; color: string }[];
  totalStudents: number;
}) {
  const size = 150;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = items.length > 1 ? 4 : 0;
  let offset = 0;

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-label="Students by class">
        {items.length === 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
        ) : (
          items.map((item) => {
            const segment = Math.max((item.percent / 100) * circumference - gap, 0);
            const dashArray = `${segment} ${circumference - segment}`;
            const dashOffset = -offset;
            offset += (item.percent / 100) * circumference;

            return (
              <circle
                key={item.class_name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={stroke}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[22px] font-bold leading-none text-text-main">
          {totalStudents.toLocaleString()}
        </span>
        <span className="mt-0.5 text-xs text-text-muted">Total</span>
      </div>
    </div>
  );
}

export function AttendanceOverviewCard({ points }: { points: AttendanceTrendPoint[] }) {
  return (
    <div className="dashboard-card flex h-full w-full flex-col p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text-main">Attendance Overview</h3>
        <span className="text-xs font-medium text-text-muted">Last 7 days</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center">
        <AttendanceLineChart points={points} />
      </div>
    </div>
  );
}

export function ClassDistributionCard({
  items,
  totalStudents,
}: {
  items: AdminClassDistribution[];
  totalStudents: number;
}) {
  const colored = items.map((item, index) => ({
    ...item,
    color: CLASS_COLORS[index % CLASS_COLORS.length],
  }));

  return (
    <div className="dashboard-card flex h-full w-full flex-col p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text-main">Students By Class</h3>
        <span className="text-xs font-medium text-text-muted">Live</span>
      </div>
      {colored.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-text-muted">
          No classes yet.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center py-2">
            <ClassDonutChart items={colored} totalStudents={totalStudents} />
          </div>
          <ul className="mt-4 w-full space-y-2.5">
            {colored.map((item) => (
              <li key={item.class_id} className="flex items-center justify-between gap-2 text-[13px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-text-muted">{item.class_name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="font-semibold text-text-main">{item.count}</span>
                  <span className="text-xs text-text-muted">({item.percent}%)</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
