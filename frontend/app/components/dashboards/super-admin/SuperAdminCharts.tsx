import { ChevronDown } from "lucide-react";
import {
  getOrgGrowthData,
  getUsersByOrganization,
  type Tenant,
} from "./systemData";

function buildSmoothPath(points: { x: number; y: number }[]) {
  return points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }, "");
}

function getYTicks(maxY: number) {
  if (maxY <= 4) {
    return Array.from({ length: maxY + 1 }, (_, i) => i);
  }

  const step = Math.ceil(maxY / 4);
  const ticks: number[] = [];
  for (let value = 0; value < maxY; value += step) ticks.push(value);
  if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
  return ticks;
}

function OrganizationGrowthChart({ tenants }: { tenants: Tenant[] }) {
  const data = getOrgGrowthData(tenants);
  const width = 560;
  const height = 220;
  const padding = { top: 24, right: 20, bottom: 36, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxY = Math.max(...data.map((d) => d.value), 1);
  const yTicks = getYTicks(maxY);

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (d.value / maxY) * chartH,
    ...d,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" aria-label="Organization growth chart">
      <defs>
        <linearGradient id="orgGrowthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => {
        const y = padding.top + chartH - (tick / maxY) * chartH;
        return (
          <g key={tick}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-text-muted text-[11px]">
              {tick}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#orgGrowthFill)" />
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p) => (
        <g key={p.label}>
          {p.highlight && (
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
              <rect x={p.x - 22} y={p.y - 36} width="44" height="26" rx="6" fill="#0f172a" />
              <text x={p.x} y={p.y - 18} textAnchor="middle" fill="white" fontSize="12" fontWeight="600">
                {p.value}
              </text>
            </>
          )}
          <text x={p.x} y={height - 10} textAnchor="middle" className="fill-text-muted text-[11px] font-medium">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function UsersDonutChart({ tenants }: { tenants: Tenant[] }) {
  const { items, total } = getUsersByOrganization(tenants);
  const size = 150;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 4;
  let offset = 0;

  if (items.length === 0) {
    return (
      <div className="flex h-[150px] w-[150px] items-center justify-center rounded-full bg-surface-soft text-xs text-text-muted">
        No data
      </div>
    );
  }

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-label="Users by organization">
        {items.map((item) => {
          const segment = (item.percent / 100) * circumference - gap;
          const dashArray = `${segment} ${circumference - segment}`;
          const dashOffset = -offset;
          offset += (item.percent / 100) * circumference;

          return (
            <circle
              key={item.name}
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
        })}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[22px] font-bold leading-none text-text-main">{total.toLocaleString()}</span>
        <span className="mt-0.5 text-xs text-text-muted">Total</span>
      </div>
    </div>
  );
}

interface SuperAdminChartsProps {
  tenants: Tenant[];
}

export function OrganizationGrowthCard({ tenants }: SuperAdminChartsProps) {
  return (
    <div className="dashboard-card flex h-full w-full flex-col p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text-main">Organization Growth</h3>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-border-main bg-white px-3 py-1.5 text-xs font-medium text-text-muted shadow-sm transition-colors hover:bg-surface-soft"
        >
          Last 6 Months
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {tenants.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12 text-sm text-text-muted">
          No organizations registered yet.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center">
          <OrganizationGrowthChart tenants={tenants} />
        </div>
      )}
    </div>
  );
}

export function UsersByOrganizationCard({ tenants }: SuperAdminChartsProps) {
  const { items } = getUsersByOrganization(tenants);

  return (
    <div className="dashboard-card flex h-full w-full flex-col p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text-main">Users By Organization</h3>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-border-main bg-white px-3 py-1.5 text-xs font-medium text-text-muted shadow-sm transition-colors hover:bg-surface-soft"
        >
          All Orgs
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center py-2">
          <UsersDonutChart tenants={tenants} />
        </div>
        <ul className="mt-4 w-full space-y-2.5">
          {items.length === 0 ? (
            <li className="text-center text-sm text-text-muted">No organizations yet.</li>
          ) : (
            items.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-2 text-[13px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-text-muted">{item.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="font-semibold text-text-main">{item.count}</span>
                  <span className="text-xs text-text-muted">({item.percent}%)</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
