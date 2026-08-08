import { useOutletContext } from "react-router";
import AdminOverview from "../components/dashboards/AdminOverview";
import SuperAdminOverview from "../components/dashboards/SuperAdminOverview";

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
  user: UserResponse;
  org: UserResponse["organization"];
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
}

export function meta() {
  return [
    { title: "Dashboard - EduManage" },
    { name: "description", content: "EduManage workspace dashboard." },
  ];
}

export default function Dashboard() {
  const { user, org, tenantData, statsLoading } = useOutletContext<DashboardContext>();

  if (user.role === "superadmin") {
    return (
      <SuperAdminOverview 
        user={user} 
        tenantData={tenantData} 
        statsLoading={statsLoading} 
      />
    );
  }

  return <AdminOverview user={user} org={org} />;
}
