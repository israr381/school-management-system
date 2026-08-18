import { useOutletContext } from "react-router";
import TeachersPanel from "../components/teachers/TeachersPanel";

interface UserResponse {
  role: string;
}

interface TeachersContext {
  user: UserResponse;
}

export function meta() {
  return [
    { title: "Teachers - Opelae School" },
    { name: "description", content: "Manage teachers and their login accounts." },
  ];
}

export default function TeachersRoute() {
  const { user } = useOutletContext<TeachersContext>();

  if (user.role !== "admin") {
    return (
      <div className="w-full">
        <div className="dashboard-card flex flex-col items-center px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-text-main">Access restricted</h2>
          <p className="mt-2 text-sm text-text-muted">
            Teacher records are only available to school administrators.
          </p>
        </div>
      </div>
    );
  }

  return <TeachersPanel />;
}
