export interface Tenant {
  id: number;
  name: string;
  domain: string;
  logo_url?: string | null;
  created_at: string;
  user_count: number;
}

export interface TenantApiResponse {
  total_tenants: number;
  total_users: number;
  tenants: Tenant[];
}

const CHART_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6"];

export function getSuperAdminKpis(tenantData: TenantApiResponse | null, loading: boolean) {
  const totalOrgs = tenantData?.total_tenants ?? 0;
  const totalUsers = tenantData?.total_users ?? 0;
  const activeOrgs = tenantData?.tenants.filter((t) => t.user_count > 0).length ?? 0;
  const avgUsers = totalOrgs > 0 ? Math.round(totalUsers / totalOrgs) : 0;

  const loadingValue = "...";

  return [
    {
      title: "Total Organizations",
      value: loading ? loadingValue : totalOrgs.toLocaleString(),
      color: "#6366f1",
    },
    {
      title: "Total Users",
      value: loading ? loadingValue : totalUsers.toLocaleString(),
      color: "#3b82f6",
    },
    {
      title: "Active Organizations",
      value: loading ? loadingValue : activeOrgs.toLocaleString(),
      color: "#10b981",
    },
    {
      title: "Avg Users / Org",
      value: loading ? loadingValue : avgUsers.toLocaleString(),
      color: "#f97316",
    },
  ];
}

export function getHeroQuickStats(tenantData: TenantApiResponse | null, loading: boolean) {
  const totalOrgs = tenantData?.total_tenants ?? 0;
  const totalUsers = tenantData?.total_users ?? 0;
  const activeOrgs = tenantData?.tenants.filter((t) => t.user_count > 0).length ?? 0;

  return [
    { label: "Total Organizations", value: loading ? "..." : totalOrgs.toLocaleString() },
    { label: "Total Users", value: loading ? "..." : totalUsers.toLocaleString() },
    { label: "Active Organizations", value: loading ? "..." : activeOrgs.toLocaleString() },
    { label: "System Status", value: loading ? "..." : "Operational" },
  ];
}

export function getOrgGrowthData(tenants: Tenant[]) {
  const months: { label: string; value: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = date.toLocaleDateString("en-US", { month: "short" });
    const count = tenants.filter((t) => {
      const created = new Date(t.created_at);
      return (
        created.getFullYear() === date.getFullYear() &&
        created.getMonth() === date.getMonth()
      );
    }).length;
    months.push({ label, value: count });
  }

  const max = Math.max(...months.map((m) => m.value), 1);
  return months.map((m, i) => ({
    ...m,
    highlight: i === months.length - 1,
    normalized: (m.value / max) * 100 || 5,
  }));
}

export function getUsersByOrganization(tenants: Tenant[]) {
  const sorted = [...tenants].sort((a, b) => b.user_count - a.user_count);
  const top = sorted.slice(0, 5);
  const restUsers = sorted.slice(5).reduce((sum, t) => sum + t.user_count, 0);
  const total = tenants.reduce((sum, t) => sum + t.user_count, 0) || 1;

  const items = top.map((t, i) => ({
    name: t.name,
    count: t.user_count,
    percent: Math.round((t.user_count / total) * 100),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (restUsers > 0) {
    items.push({
      name: "Others",
      count: restUsers,
      percent: Math.round((restUsers / total) * 100),
      color: CHART_COLORS[5],
    });
  }

  return { items, total };
}

export function getRecentOrganizations(tenants: Tenant[]) {
  return [...tenants]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map((t) => ({
      title: t.name,
      description: `Registered at ${t.domain}`,
      time: formatRelativeTime(t.created_at),
      domain: t.domain,
      logo_url: t.logo_url,
    }));
}

export function getTopOrganizations(tenants: Tenant[]) {
  return [...tenants]
    .sort((a, b) => b.user_count - a.user_count)
    .slice(0, 4)
    .map((t, i) => ({
      rank: i + 1,
      name: t.name,
      domain: t.domain,
      users: t.user_count,
      logo_url: t.logo_url,
    }));
}

export function getSystemUpdates(tenants: Tenant[]) {
  const recent = [...tenants]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return recent.map((t) => ({
    dateLabel: formatEventDate(t.created_at),
    title: `${t.name} onboarded`,
    range: `${t.user_count} user${t.user_count === 1 ? "" : "s"} registered`,
  }));
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month}`;
}
