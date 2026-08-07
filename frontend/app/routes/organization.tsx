import { useOutletContext } from "react-router";
import AdminOrganizationPanel from "../components/dashboards/AdminOrganizationPanel";
import SuperAdminOrganizationPanel from "../components/dashboards/SuperAdminOrganizationPanel";

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

interface OrganizationContext {
  user: UserResponse;
  org: UserResponse["organization"];
  setOrg: (org: UserResponse["organization"]) => void;
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
  const { 
    user, 
    org, 
    setOrg, 
    tenantData, 
    statsLoading, 
    refreshStats 
  } = useOutletContext<OrganizationContext>();

  if (user.role === "superadmin") {
    return (
      <SuperAdminOrganizationPanel 
        tenantData={tenantData} 
        statsLoading={statsLoading} 
        refreshStats={refreshStats} 
      />
    );
  }

  return (
    <AdminOrganizationPanel 
      user={user} 
      org={org} 
      setOrg={setOrg} 
    />
  );
}
