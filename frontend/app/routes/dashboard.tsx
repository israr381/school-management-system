import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import SuperAdminDashboard from "../components/dashboards/SuperAdminDashboard";

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

export function meta() {
  return [
    { title: "Dashboard - EduManage" },
    { name: "description", content: "EduManage workspace dashboard." },
  ];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (user.role === "superadmin") {
    return <SuperAdminDashboard user={user} handleLogout={handleLogout} />;
  }

  return <AdminDashboard user={user} handleLogout={handleLogout} />;
}
