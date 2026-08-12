import { useOutletContext } from "react-router";
import AdminOrganizationPanel from "../components/organization/AdminOrganizationPanel";
import SuperAdminOrganizationPanel from "../components/organization/SuperAdminOrganizationPanel";

interface UserResponse {
  role: string;
}

interface Organization {
  id: number;
  name: string;
  domain: string;
  logo_url?: string | null;
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
  org: Organization | null;
  setOrg: (org: Organization) => void;
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;
}

export function meta() {
  return [
    { title: "Organization - Opelae School" },
    { name: "description", content: "Manage your organization details." },
  ];
}

export default function OrganizationRoute() {
  const { user, org, setOrg, tenantData, statsLoading, refreshStats } =
    useOutletContext<OrganizationContext>();

  if (user.role === "superadmin") {
    return (
      <SuperAdminOrganizationPanel
        tenantData={tenantData}
        statsLoading={statsLoading}
        refreshStats={refreshStats}
      />
    );
  }

  if (user.role === "admin") {
    return <AdminOrganizationPanel org={org} onOrgChange={setOrg} />;
  }

  return (
    <div className="w-full">
      <div className="dashboard-card flex flex-col items-center px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-text-main">Access restricted</h2>
        <p className="mt-2 text-sm text-text-muted">
          Organization settings are only available to school administrators.
        </p>
      </div>
    </div>
  );
}
