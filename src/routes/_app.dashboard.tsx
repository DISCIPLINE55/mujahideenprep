import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GraduationCap,
  School,
  Wallet,
  TrendingUp,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MPSMS" },
      { name: "description", content: "School management dashboard overview" },
    ],
  }),
  component: DashboardPage,
});

const recentStudents = [
  { name: "Amina Ibrahim", class: "JHS 3", status: "Active" },
  { name: "Kwame Mensah", class: "Primary 6", status: "Active" },
  { name: "Fatima Agyei", class: "KG 2", status: "Active" },
  { name: "Yusuf Osei", class: "JHS 1", status: "Pending" },
  { name: "Zainab Boateng", class: "Nursery 2", status: "Active" },
];

const upcomingEvents = [
  { title: "Mid-Term Exams", date: "Apr 21, 2026", type: "Exam" },
  { title: "PTA Meeting", date: "Apr 25, 2026", type: "Meeting" },
  { title: "Sports Day", date: "May 2, 2026", type: "Event" },
  { title: "Term Ends", date: "May 30, 2026", type: "Holiday" },
];

function DashboardPage() {
  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Welcome back, Admin 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening at Mujahideen Preparatory School today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value="524"
            icon={Users}
            trend={{ value: "12 new this term", positive: true }}
          />
          <StatsCard
            title="Teachers"
            value="32"
            icon={GraduationCap}
            trend={{ value: "2 new hires", positive: true }}
          />
          <StatsCard
            title="Classes"
            value="15"
            icon={School}
          />
          <StatsCard
            title="Fees Collected"
            value="₵ 45,200"
            icon={Wallet}
            trend={{ value: "78% collected", positive: true }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Students */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Enrollments</CardTitle>
              <Link to="/students" className="text-xs text-primary hover:underline font-medium">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentStudents.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.class}</p>
                      </div>
                    </div>
                    <Badge variant={s.status === "Active" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar info */}
          <div className="space-y-6">
            {/* Attendance overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Present</span>
                    <span className="font-medium text-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-success/10 p-2">
                    <p className="text-lg font-bold text-success">482</p>
                    <p className="text-[11px] text-muted-foreground">Present</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <p className="text-lg font-bold text-destructive">28</p>
                    <p className="text-[11px] text-muted-foreground">Absent</p>
                  </div>
                  <div className="rounded-lg bg-warning/10 p-2">
                    <p className="text-lg font-bold text-warning">14</p>
                    <p className="text-[11px] text-muted-foreground">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming events */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map((e) => (
                    <div key={e.title} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                        <CalendarDays className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
