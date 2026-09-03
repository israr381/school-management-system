import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  CalendarOff,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  UserCheck,
  UserX,
} from "lucide-react";
import type { UserPayload } from "../../../store/user";
import type { DashboardStudentCard, ParentDashboardData } from "../../../store/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  AttendanceTrendCard,
  DashboardKpiGrid,
  EmptyDashboardCard,
  NameAvatar,
  RecentAttendanceCard,
  RoleDashboardHero,
  StatusBadge,
  statusLabel,
} from "../shared/dashboardUi";

interface ParentOverviewProps {
  user: UserPayload;
  orgName: string;
  data: ParentDashboardData;
}

function enrollmentLabel(child: DashboardStudentCard) {
  return `${child.class_name} ${child.section_name}`.trim() || "Class not assigned";
}

function ChildDetailPanel({ child }: { child: DashboardStudentCard }) {
  const classLabel = enrollmentLabel(child);
  const statusText =
    child.status === "active" ? "Active" : child.status === "disabled" ? "Disabled" : "Graduated";

  return (
    <div className="space-y-5">
      <DashboardKpiGrid
        cards={[
          {
            title: "Total Days",
            value: child.attendance.total,
            color: "#6366f1",
            icon: CalendarCheck,
          },
          {
            title: "Present",
            value: child.attendance.present,
            color: "#10b981",
            icon: UserCheck,
          },
          {
            title: "Absent",
            value: child.attendance.absent,
            color: "#ef4444",
            icon: UserX,
          },
          {
            title: "Late",
            value: child.attendance.late,
            color: "#f97316",
            icon: Clock,
          },
          {
            title: "Leave",
            value: child.attendance.leave ?? 0,
            color: "#0ea5e9",
            icon: CalendarOff,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <AttendanceTrendCard title="Attendance" points={child.trend ?? []} />
        </div>
        <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
          <h3 className="mb-5 text-[15px] font-semibold text-text-main">Today</h3>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-main">{classLabel}</p>
              <p className="mt-0.5 text-xs text-text-muted">Current attendance status</p>
            </div>
            <StatusBadge status={child.today_status} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-soft px-2 py-3">
              <p className="text-lg font-bold text-text-main">{child.attendance.percent}%</p>
              <p className="text-[11px] text-text-muted">Overall</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-2 py-3">
              <p className="text-lg font-bold text-text-main">{child.attendance.present}</p>
              <p className="text-[11px] text-text-muted">Present</p>
            </div>
            <div className="rounded-xl bg-surface-soft px-2 py-3">
              <p className="text-lg font-bold text-text-main">{child.attendance.absent}</p>
              <p className="text-[11px] text-text-muted">Absent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
        <RecentAttendanceCard
          title="Recent Attendance"
          records={child.recent}
          emptyText="Attendance will appear here after it has been taken."
        />
        <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
          <h3 className="mb-5 text-[15px] font-semibold text-text-main">Student Details</h3>
          <div className="flex items-start gap-3">
            <NameAvatar name={child.full_name} avatarUrl={child.avatar_url} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-main">{child.full_name}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                {classLabel} · {statusText}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex items-center gap-2 text-text-muted">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{child.email || "No email on file"}</span>
            </p>
            <p className="flex items-center gap-2 text-text-muted">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">{child.phone || "No phone on file"}</span>
            </p>
            <p className="flex items-start gap-2 text-text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{child.address || "No address on file"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParentOverview({ user, orgName, data }: ParentOverviewProps) {
  const children = data.children;
  const [selectedId, setSelectedId] = useState(() => String(children[0]?.id ?? ""));
  const selectedChild = useMemo(
    () => children.find((child) => String(child.id) === selectedId) ?? children[0] ?? null,
    [children, selectedId],
  );
  const showTabs = children.length > 1;
  const classLabel = selectedChild ? enrollmentLabel(selectedChild) : "—";

  const hero = (
    <RoleDashboardHero
      userName={user.full_name}
      subtitle={
        selectedChild
          ? `Viewing ${selectedChild.full_name}'s overview at ${orgName}.`
          : `Here's how your children are doing at ${orgName}.`
      }
      stats={
        selectedChild
          ? [
              { label: "Class", value: classLabel, icon: BookOpen },
              { label: "Today", value: statusLabel(selectedChild.today_status), icon: CalendarCheck },
              {
                label: "Attendance",
                value: `${selectedChild.attendance.percent}%`,
                icon: UserCheck,
              },
              {
                label: "Days Recorded",
                value: String(selectedChild.attendance.total),
                icon: Clock,
              },
            ]
          : [
              { label: "Children", value: "0", icon: GraduationCap },
              { label: "Present Today", value: "0", icon: UserCheck },
              { label: "Absent Today", value: "0", icon: UserX },
              { label: "Attendance", value: "0%", icon: CalendarCheck },
            ]
      }
    />
  );

  return (
    <div className="mx-auto max-w-350 space-y-5">
      {children.length === 0 ? (
        <>
          {hero}
          <EmptyDashboardCard
            icon={<GraduationCap className="h-7 w-7" />}
            title="No children linked"
            description="When a student is linked to this parent account, their class and attendance will appear here."
          />
        </>
      ) : showTabs && selectedChild ? (
        <Tabs value={String(selectedChild.id)} onValueChange={setSelectedId} className="gap-5">
          <TabsList className="h-auto w-fit max-w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border-main bg-app-bg p-1">
            {children.map((child) => (
              <TabsTrigger
                key={child.id}
                value={String(child.id)}
                className="h-9 flex-none rounded-lg border-0 bg-transparent px-4 text-sm font-semibold text-text-muted shadow-none after:hidden hover:bg-panel-bg/50 hover:text-text-main data-active:bg-panel-bg data-active:text-text-main data-active:shadow-sm data-active:ring-1 data-active:ring-border-main dark:data-active:bg-panel-bg dark:data-active:text-text-main"
              >
                {child.full_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {hero}
          <TabsContent value={String(selectedChild.id)} className="mt-0 outline-none">
            <ChildDetailPanel child={selectedChild} />
          </TabsContent>
        </Tabs>
      ) : selectedChild ? (
        <>
          {hero}
          <ChildDetailPanel child={selectedChild} />
        </>
      ) : null}
    </div>
  );
}
