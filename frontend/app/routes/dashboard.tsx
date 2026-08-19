import { useOutletContext } from "react-router";
import AdminOverview from "../components/dashboards/admin/AdminOverview";
import SuperAdminOverview from "../components/dashboards/super-admin/SuperAdminOverview";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";
import { usePermission } from "../hooks/usePermission";
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
        <AdminOverview user={user} org={org} />
      )}
    </ProtectedRoute>
  );
}
