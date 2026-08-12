import { Calendar, Megaphone, Receipt, Trophy } from "lucide-react";
import Button from "../../button/Button";
import StudentAvatar from "./StudentAvatar";
import { announcements, topStudents, upcomingEvents } from "./mockData";

const announcementIcons = {
  megaphone: Megaphone,
  trophy: Trophy,
  receipt: Receipt,
};

export function RecentAnnouncementsCard() {
  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Recent Announcements</h3>
      <ul className="flex-1 space-y-5">
        {announcements.map((item) => {
          const Icon = announcementIcons[item.icon];
          return (
            <li key={item.title} className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-main">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{item.description}</p>
                <p className="mt-1 text-[11px] text-text-muted/80">{item.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <Button variant="primary" className="mt-6 w-full py-2.5 text-sm">
        View All Announcements
      </Button>
    </div>
  );
}

export function UpcomingEventsCard() {
  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Upcoming Events</h3>
      <ul className="flex-1 space-y-4">
        {upcomingEvents.map((event) => (
          <li key={event.title} className="flex items-start gap-3">
            <span className="shrink-0 text-sm font-bold text-text-main">{event.dateLabel}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-main">{event.title}</p>
              <p className="mt-0.5 text-xs text-text-muted">{event.range}</p>
            </div>
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-icon-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopStudentsCard() {
  return (
    <div className="dashboard-card flex h-full flex-col p-5 sm:p-6">
      <h3 className="mb-5 text-[15px] font-semibold text-text-main">Top Performing Students</h3>
      <ul className="flex-1 space-y-4">
        {topStudents.map((student) => (
          <li key={student.name} className="flex items-center gap-3">
            <StudentAvatar name={student.name} avatar={student.avatar} rank={student.rank} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-main">{student.name}</p>
              <p className="text-xs text-text-muted">{student.grade}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-success">{student.score}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
