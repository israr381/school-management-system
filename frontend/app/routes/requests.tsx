import RequestsPanel from "../components/requests/RequestsPanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "Requests - School Management" },
    { name: "description", content: "Review student and teacher leave requests." },
  ];
}

export default function RequestsRoute() {
  return (
    <ProtectedRoute
      permission="requests.view"
      fallback={
        <AccessRestricted description="You do not have permission to view requests." />
      }
    >
      <RequestsPanel />
    </ProtectedRoute>
  );
}
