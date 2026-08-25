import MyRequestsPanel from "../components/requests/MyRequestsPanel";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccessRestricted from "../components/AccessRestricted";

export function meta() {
  return [
    { title: "My Request - School Management" },
    { name: "description", content: "Submit and track your leave requests." },
  ];
}

export default function MyRequestsRoute() {
  return (
    <ProtectedRoute
      permission="my_requests.view"
      fallback={
        <AccessRestricted description="You do not have permission to view your requests." />
      }
    >
      <MyRequestsPanel />
    </ProtectedRoute>
  );
}
