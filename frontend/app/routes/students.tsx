import { useOutletContext } from "react-router";
import StudentsPanel from "../components/students/StudentsPanel";

interface UserResponse {
  role: string;
}

interface StudentsContext {
  user: UserResponse;
}

export function meta() {
  return [
    { title: "Students - Opelae School" },
    { name: "description", content: "Manage students, classes, and parent accounts." },
  ];
}

export default function StudentsRoute() {
  const { user } = useOutletContext<StudentsContext>();

  if (user.role !== "admin") {
    return (
      <div className="w-full">
        <div className="dashboard-card flex flex-col items-center px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-text-main">Access restricted</h2>
          <p className="mt-2 text-sm text-text-muted">
            Student records are only available to school administrators.
          </p>
        </div>
      </div>
    );
  }

  return <StudentsPanel />;
}
