import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Wallet, ClipboardCheck, FileText, CalendarDays } from "lucide-react";
import { getItems, defaultStudents, defaultPayments, defaultEvents, KEYS, type Student, type Payment, type AttendanceRecord, type ExamResult, type SchoolEvent } from "@/lib/storage";
import { getAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/parent-dashboard")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — MPSMS" },
      { name: "description", content: "Parent portal for Mujahideen Preparatory School" },
    ],
  }),
  component: ParentDashboard,
});

function ParentDashboard() {
  const auth = getAuth();
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const payments = getItems<Payment>(KEYS.PAYMENTS, defaultPayments);
  const attendance = getItems<AttendanceRecord>(KEYS.ATTENDANCE, []);
  const results = getItems<ExamResult>(KEYS.RESULTS, []);
  const events = getItems<SchoolEvent>(KEYS.EVENTS, defaultEvents);

  const myStudents = useMemo(() =>
    students.filter((s) => auth?.studentIds?.includes(s.id)),
    [students, auth]
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const upcomingEvents = useMemo(() =>
    [...events].filter((e) => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [events, todayStr]
  );

  return (
    <>
      <TopBar title="Parent Dashboard" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{greeting}, {auth?.name ?? "Parent"} 👋</h2>
          <p className="text-sm text-muted-foreground">Here's how your child is doing at Mujahideen Preparatory School.</p>
        </div>

        {myStudents.map((student) => {
          const studentPayments = payments.filter((p) => p.studentId === student.id);
          const totalFees = studentPayments.reduce((s, p) => s + p.totalFee, 0);
          const totalPaid = studentPayments.reduce((s, p) => s + p.amountPaid, 0);
          const balance = totalFees - totalPaid;
          const studentAttendance = attendance.filter((a) => a.studentId === student.id);
          const presentCount = studentAttendance.filter((a) => a.status === "Present").length;
          const attendanceRate = studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 0;
          const studentResults = results.filter((r) => r.studentId === student.id);
          const latestResult = studentResults.length > 0 ? studentResults[studentResults.length - 1] : null;

          return (
            <div key={student.id} className="space-y-4">
              <div className="flex items-center gap-3">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{student.name.charAt(0)}</div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">{student.class} • {student.gender}</p>
                </div>
                <Badge variant={student.status === "Active" ? "default" : "secondary"} className="ml-auto">{student.status}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Attendance Rate" value={`${attendanceRate}%`} icon={ClipboardCheck} trend={{ value: `${studentAttendance.length} days tracked`, positive: attendanceRate >= 80 }} />
                <StatsCard title="Latest Average" value={latestResult ? `${latestResult.average.toFixed(1)}%` : "—"} icon={FileText} />
                <StatsCard title="Total Fees" value={`₵ ${totalFees.toLocaleString()}`} icon={Wallet} />
                <StatsCard title="Balance Due" value={`₵ ${balance.toLocaleString()}`} icon={Wallet} trend={{ value: balance === 0 ? "Fully paid" : "Outstanding", positive: balance === 0 }} />
              </div>

              {/* Fee progress */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Fee Payment Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Paid: ₵ {totalPaid.toLocaleString()}</span>
                    <span className="font-medium text-foreground">{totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0}%</span>
                  </div>
                  <Progress value={totalFees > 0 ? (totalPaid / totalFees) * 100 : 0} className="h-3" />
                </CardContent>
              </Card>

              {/* Latest results */}
              {latestResult && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Latest Exam Results — {latestResult.term}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {latestResult.subjects.map((sub, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm text-foreground">{sub.name}</span>
                          <Badge variant={sub.score >= 70 ? "default" : sub.score >= 50 ? "secondary" : "destructive"}>{sub.score}%</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Total: <strong className="text-foreground">{latestResult.total}</strong></span>
                      <span className="text-muted-foreground">Average: <strong className="text-foreground">{latestResult.average.toFixed(1)}%</strong></span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}

        {myStudents.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No students linked to your account yet.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Upcoming School Events</CardTitle></CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No upcoming events.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} • {e.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
