import { useOutletContext } from "react-router";
  import SuperAdminOrganizationPanel from "../components/dashboards/SuperAdminOrganizationPanel";

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

interface OrganizationContext {
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;
}

export function meta() {
  return [
    { title: "Organization Profile - EduManage" },
    { name: "description", content: "Manage organization details." },
  ];
}

export default function OrganizationRoute() {
  const { tenantData, statsLoading, refreshStats } =
    useOutletContext<OrganizationContext>();

  return (
    <SuperAdminOrganizationPanel
      tenantData={tenantData}
      statsLoading={statsLoading}
      refreshStats={refreshStats}
    />
  );
}
