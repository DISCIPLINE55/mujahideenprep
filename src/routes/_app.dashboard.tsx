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
  CalendarDays,
} from "lucide-react";
import { getItems, defaultStudents, defaultTeachers, defaultClasses, defaultPayments, KEYS, type Student, type Teacher, type SchoolClass, type Payment } from "@/lib/storage";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MPSMS" },
      { name: "description", content: "School management dashboard overview" },
    ],
  }),
  component: DashboardPage,
});

const upcomingEvents = [
  { title: "Mid-Term Exams", date: "Apr 21, 2026", type: "Exam" },
  { title: "PTA Meeting", date: "Apr 25, 2026", type: "Meeting" },
  { title: "Sports Day", date: "May 2, 2026", type: "Event" },
  { title: "Term Ends", date: "May 30, 2026", type: "Holiday" },
];

function DashboardPage() {
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const classes = getItems<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const payments = getItems<Payment>(KEYS.PAYMENTS, defaultPayments);

  const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);
  const activeStudents = students.filter((s) => s.status === "Active").length;

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Welcome back, Admin 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening at Mujahideen Preparatory School today.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Students" value={students.length} icon={Users} trend={{ value: `${activeStudents} active`, positive: true }} />
          <StatsCard title="Teachers" value={teachers.length} icon={GraduationCap} trend={{ value: `${teachers.filter(t => t.status === "Active").length} active`, positive: true }} />
          <StatsCard title="Classes" value={classes.length} icon={School} />
          <StatsCard title="Fees Collected" value={`₵ ${totalCollected.toLocaleString()}`} icon={Wallet} trend={{ value: `${payments.length} payments`, positive: true }} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Students</CardTitle>
              <Link to="/students" className="text-xs text-secondary hover:underline font-medium">View all</Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.class}</p>
                      </div>
                    </div>
                    <Badge variant={s.status === "Active" ? "default" : "secondary"}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Active Students</span>
                    <span className="font-medium text-foreground">{Math.round((activeStudents / (students.length || 1)) * 100)}%</span>
                  </div>
                  <Progress value={(activeStudents / (students.length || 1)) * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-success/10 p-2">
                    <p className="text-lg font-bold text-success">{activeStudents}</p>
                    <p className="text-[11px] text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <p className="text-lg font-bold text-destructive">{students.length - activeStudents}</p>
                    <p className="text-[11px] text-muted-foreground">Inactive</p>
                  </div>
                  <div className="rounded-lg bg-info/10 p-2">
                    <p className="text-lg font-bold text-info">{teachers.length}</p>
                    <p className="text-[11px] text-muted-foreground">Staff</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
