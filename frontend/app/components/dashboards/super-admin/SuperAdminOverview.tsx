import { Activity, Building2, Globe, Users } from "lucide-react";
import SuperAdminHero from "./SuperAdminHero";
import { OrganizationGrowthCard, UsersByOrganizationCard } from "./SuperAdminCharts";
import {
  RecentOrganizationsCard,
  SystemUpdatesCard,
  TopOrganizationsCard,
} from "./SuperAdminLists";
import { getSuperAdminKpis, type TenantApiResponse } from "./systemData";

interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  organization: {
    id: number;
    name: string;
    domain: string;
  } | null;
}

interface SuperAdminOverviewProps {
  user: UserResponse;
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
}

const kpiIcons = [Building2, Users, Activity, Globe];

export default function SuperAdminOverview({
  user,
  tenantData,
  statsLoading,
}: SuperAdminOverviewProps) {
  const kpiCards = getSuperAdminKpis(tenantData, statsLoading);
  const tenants = tenantData?.tenants ?? [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 animate-fade-in">
      <SuperAdminHero
        userName={user.full_name}
        tenantData={tenantData}
        statsLoading={statsLoading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat, idx) => {
          const Icon = kpiIcons[idx];
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
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <OrganizationGrowthCard tenants={tenants} />
        </div>
        <div className="lg:col-span-1">
          <UsersByOrganizationCard tenants={tenants} />
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
        <RecentOrganizationsCard tenants={tenants} />
        <SystemUpdatesCard tenants={tenants} />
        <TopOrganizationsCard tenants={tenants} />
      </div>
    </div>
  );
}
