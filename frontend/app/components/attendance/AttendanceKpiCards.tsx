import type { LucideIcon } from "lucide-react";

export type AttendanceKpi = {
  key: string;
  title: string;
  value: number | string;
  color: string;
  icon: LucideIcon;
  subtitle?: string;
};

type AttendanceKpiCardsProps = {
  cards: AttendanceKpi[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
};

export default function AttendanceKpiCards({
  cards,
  selectedKey,
  onSelect,
}: AttendanceKpiCardsProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cards.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
      {cards.map((stat) => {
        const Icon = stat.icon;
        const selected = selectedKey === stat.key;
        const className = `dashboard-card p-5 text-left transition-shadow ${
          selected ? "ring-2 ring-brand" : ""
        } ${onSelect ? "cursor-pointer" : ""}`;

        const content = (
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
        );

        if (!onSelect) {
          return (
            <div key={stat.key} className={className}>
              {content}
            </div>
          );
        }

        return (
          <button
            key={stat.key}
            type="button"
            onClick={() => onSelect(stat.key)}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
