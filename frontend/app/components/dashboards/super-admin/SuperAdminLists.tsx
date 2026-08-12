import { Building2, Calendar, Globe, Server } from "lucide-react";
import { Link } from "react-router";
import Button from "../../button/Button";
import {
  getRecentOrganizations,
  getSystemUpdates,
  getTopOrganizations,
  type Tenant,
} from "./systemData";

interface SuperAdminListsProps {
  tenants: Tenant[];
}

export function RecentOrganizationsCard({ tenants }: SuperAdminListsProps) {
  const recent = getRecentOrganizations(tenants);

  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Recent Organizations</h3>
      {recent.length === 0 ? (
        <p className="flex-1 text-sm text-text-muted">No organizations registered yet.</p>
      ) : (
        <ul className="flex-1 space-y-5">
          {recent.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Building2 className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{item.description}</p>
                <p className="mt-1 text-[11px] text-text-muted/80">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link to="/organization">
        <Button variant="primary" className="mt-6 w-full py-2.5 text-sm">
          View All Organizations
        </Button>
      </Link>
    </div>
  );
}

export function SystemUpdatesCard({ tenants }: SuperAdminListsProps) {
  const updates = getSystemUpdates(tenants);

  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">System Updates</h3>
      {updates.length === 0 ? (
        <p className="flex-1 text-sm text-text-muted">No recent platform activity.</p>
      ) : (
        <ul className="flex-1 space-y-4">
          {updates.map((event) => (
            <li key={event.title} className="flex items-start gap-3">
              <span className="shrink-0 text-sm font-bold text-text-main">{event.dateLabel}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main">{event.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{event.range}</p>
              </div>
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-icon-muted" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const rankBadgeStyles: Record<number, string> = {
  1: "bg-amber-400 text-white ring-2 ring-amber-200",
  2: "bg-slate-400 text-white ring-2 ring-slate-200",
  3: "bg-orange-400 text-white ring-2 ring-orange-200",
};

export function TopOrganizationsCard({ tenants }: SuperAdminListsProps) {
  const top = getTopOrganizations(tenants);

  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Top Organizations</h3>
      {top.length === 0 ? (
        <p className="flex-1 text-sm text-text-muted">No organizations to rank yet.</p>
      ) : (
        <ul className="flex-1 space-y-4">
          {top.map((org) => (
            <li key={org.name} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white ring-2 ring-border-main/60"
                  style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
                >
                  <Globe className="h-4 w-4" />
                </div>
                {org.rank <= 3 && (
                  <span
                    className={`absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${rankBadgeStyles[org.rank]}`}
                  >
                    {org.rank}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-main">{org.name}</p>
                <p className="text-xs text-text-muted">{org.domain}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-sm font-bold text-success">
                <Server className="h-3.5 w-3.5" />
                {org.users}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
