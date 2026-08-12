import {
  ClipboardCheck,
  CircleDollarSign,
  User,
  Users,
} from "lucide-react";
import DashboardHero from "./DashboardHero";
import { AttendanceOverviewCard, ClassDistributionCard } from "./DashboardCharts";
import {
  RecentAnnouncementsCard,
  TopStudentsCard,
  UpcomingEventsCard,
} from "./DashboardLists";
import { kpiCards } from "./mockData";

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

interface AdminOverviewProps {
  user: UserResponse;
  org: UserResponse["organization"];
}

const kpiIcons = [User, Users, ClipboardCheck, CircleDollarSign];

export default function AdminOverview({ user, org }: AdminOverviewProps) {
  const schoolName = org?.name ?? "Opelae School";

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <DashboardHero userName={user.full_name} schoolName={schoolName} />

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

      {/* Charts Row — 2/3 + 1/3 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <AttendanceOverviewCard />
        </div>
        <div className="lg:col-span-1">
          <ClassDistributionCard />
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5">
        <RecentAnnouncementsCard />
        <UpcomingEventsCard />
        <TopStudentsCard />
      </div>
    </div>
  );
}
