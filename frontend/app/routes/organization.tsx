import { useOutletContext } from "react-router";
import AdminOrganizationPanel from "../components/organization/AdminOrganizationPanel";
import SuperAdminOrganizationPanel from "../components/organization/SuperAdminOrganizationPanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";
import type { UserPayload } from "../store/user";

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
  user: UserPayload;
  org: Organization | null;
  setOrg: (org: Organization) => void;
  tenantData: TenantApiResponse | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;
}

export function meta() {
  return [
    { title: "Organization - School Management" },
    { name: "description", content: "Manage your organization details." },
  ];
}

export default function OrganizationRoute() {
  const { user, org, setOrg, tenantData, statsLoading, refreshStats } =
    useOutletContext<OrganizationContext>();

  return (
    <ProtectedRoute
      permission="organization.view"
      fallback={
        <AccessRestricted description="You do not have permission to view organization settings." />
      }
    >
      {!user.organization_id ? (
        <SuperAdminOrganizationPanel
          tenantData={tenantData}
          statsLoading={statsLoading}
          refreshStats={refreshStats}
        />
      ) : (
        <AdminOrganizationPanel org={org} onOrgChange={setOrg} />
      )}
    </ProtectedRoute>
  );
}
