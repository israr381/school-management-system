import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { useOutletContext } from "react-router";
import AdminOverview from "../components/dashboards/admin/AdminOverview";
import SuperAdminOverview from "../components/dashboards/super-admin/SuperAdminOverview";
import TeacherOverview from "../components/dashboards/teacher/TeacherOverview";
import StudentOverview from "../components/dashboards/student/StudentOverview";
import ParentOverview from "../components/dashboards/parent/ParentOverview";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";
import { usePermission } from "../hooks/usePermission";
import { getAccessToken } from "../store/auth";
import { fetchRoleDashboard, type RoleDashboardResponse } from "../store/dashboard";
import { toast } from "../components/toast/toast";
import { DashboardLoading, EmptyDashboardCard } from "../components/dashboards/shared/dashboardUi";
import type { UserPayload } from "../store/user";

interface Tenant {
  id: number;
  name: string;
  domain: string;
  created_at: string;
  user_count: number;
}

interface TenantApiResponse {
  total_tenants: number;
  total_users: number;
  tenants: Tenant[];
}

interface DashboardContext {
  user: UserPayload;
  org: UserPayload["organization"];
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
}

export function meta() {
  return [
    { title: "Dashboard - Opelae School" },
    { name: "description", content: "Opelae School management dashboard." },
  ];
}

function RoleDashboard({ user, org }: { user: UserPayload; org: UserPayload["organization"] }) {
  const [data, setData] = useState<RoleDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const orgName = org?.name ?? "your school";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const result = await fetchRoleDashboard(token);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <DashboardLoading />;
  }

  if (user.role === "teacher" && data?.teacher) {
    return <TeacherOverview user={user} orgName={orgName} data={data.teacher} />;
  }

  if (user.role === "student" && data?.student) {
    return <StudentOverview user={user} orgName={orgName} data={data.student} />;
  }

  if (user.role === "parent" && data?.parent) {
    return <ParentOverview user={user} orgName={orgName} data={data.parent} />;
  }

  if (data?.admin) {
    return <AdminOverview user={user} org={org} data={data.admin} />;
  }

  return (
    <EmptyDashboardCard
      icon={<LayoutDashboard className="h-7 w-7" />}
      title="Dashboard unavailable"
      description="We could not load live dashboard data for this account. Please refresh and try again."
    />
  );
}

export default function Dashboard() {
  const { user, org, tenantData, statsLoading } = useOutletContext<DashboardContext>();
  const { hasPermission } = usePermission();

  return (
    <ProtectedRoute
      permission="dashboard.view"
      fallback={
        <AccessRestricted description="You do not have permission to view the dashboard." />
      }
    >
      {!user.organization_id && hasPermission("organization.view") ? (
        <SuperAdminOverview
          user={user}
          tenantData={tenantData}
          statsLoading={statsLoading}
        />
      ) : (
        <RoleDashboard user={user} org={org} />
      )}
    </ProtectedRoute>
  );
}
