export const dashboardStats = {
  academicYear: "2026 - 2027",
  totalStudents: 1248,
  totalTeachers: 85,
  activeClasses: 42,
  attendance: 92.6,
  feeCollection: "PKR 1.25M",
};

export const kpiCards = [
  { title: "Total Students", value: "1,248", color: "#6366f1" },
  { title: "Total Teachers", value: "85", color: "#3b82f6" },
  { title: "Attendance", value: "92.6%", color: "#10b981" },
  { title: "Fee Collection", value: "PKR 1.25M", color: "#f97316" },
];

export const attendanceData: {
  day: string;
  value: number;
  highlight?: boolean;
}[] = [
  { day: "Mon", value: 86 },
  { day: "Tue", value: 89 },
  { day: "Wed", value: 87 },
  { day: "Thu", value: 92.6, highlight: true },
  { day: "Fri", value: 85 },
  { day: "Sat", value: 82 },
  { day: "Sun", value: 80 },
];

export const classDistribution = [
  { grade: "Grade 6", count: 320, percent: 25, color: "#6366f1" },
  { grade: "Grade 7", count: 280, percent: 22, color: "#3b82f6" },
  { grade: "Grade 8", count: 260, percent: 21, color: "#10b981" },
  { grade: "Grade 9", count: 210, percent: 17, color: "#f97316" },
  { grade: "Grade 10", count: 178, percent: 15, color: "#ec4899" },
];

export const announcements = [
  {
    title: "Mid Term Exams Schedule",
    description: "Exams will begin from August 15th for all grades.",
    time: "2 hours ago",
    icon: "megaphone" as const,
    color: "#6366f1",
    bgColor: "#eef2ff",
  },
  {
    title: "Sports Day Event",
    description: "Annual sports day registration is now open.",
    time: "1 day ago",
    icon: "trophy" as const,
    color: "#f97316",
    bgColor: "#fff7ed",
  },
  {
    title: "Fee Submission Reminder",
    description: "Please submit pending fees before August 20th.",
    time: "2 days ago",
    icon: "receipt" as const,
    color: "#10b981",
    bgColor: "#ecfdf5",
  },
];

export const upcomingEvents = [
  { dateLabel: "15 Aug", title: "Mid Term Exams", range: "Aug 15 - Aug 25" },
  { dateLabel: "25 Aug", title: "Sports Day", range: "Aug 25" },
  { dateLabel: "05 Sep", title: "Parent Teacher Meeting", range: "Sep 05" },
];

export const topStudents = [
  { rank: 1, name: "Muhammad Ali", grade: "Grade 10-A", score: 96.4, avatar: "https://i.pravatar.cc/80?img=12" },
  { rank: 2, name: "Fatima Khan", grade: "Grade 10-B", score: 95.1, avatar: "https://i.pravatar.cc/80?img=5" },
  { rank: 3, name: "Ahmed Hassan", grade: "Grade 9-A", score: 94.8, avatar: "https://i.pravatar.cc/80?img=33" },
  { rank: 4, name: "Sara Malik", grade: "Grade 9-B", score: 93.5, avatar: "https://i.pravatar.cc/80?img=9" },
];
