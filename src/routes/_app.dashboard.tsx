import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  School,
  Wallet,
  CalendarDays,
  Plus,
  Trash2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useStore } from "@/hooks/use-store";
import { getItems, defaultStudents, defaultTeachers, defaultClasses, defaultPayments, defaultEvents, KEYS, type Student, type Teacher, type SchoolClass, type Payment, type AttendanceRecord, type SchoolEvent } from "@/lib/storage";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MPSMS" },
      { name: "description", content: "School management dashboard for Mujahideen Preparatory School" },
      { property: "og:title", content: "Dashboard — MPSMS" },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = ["oklch(0.28 0.14 280)", "oklch(0.55 0.22 340)", "oklch(0.85 0.20 130)", "oklch(0.75 0.15 80)"];

const EVENT_TYPES: SchoolEvent["type"][] = ["Exam", "Meeting", "Event", "Holiday", "Other"];

function DashboardPage() {
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const classes = getItems<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const payments = getItems<Payment>(KEYS.PAYMENTS, defaultPayments);
  const eventStore = useStore<SchoolEvent>(KEYS.EVENTS, defaultEvents);

  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", date: "", type: "Event" as SchoolEvent["type"] });

  const { totalCollected, activeStudents } = useMemo(() => ({
    totalCollected: payments.reduce((s, p) => s + p.amountPaid, 0),
    activeStudents: students.filter((s) => s.status === "Active").length,
  }), [students, payments]);

  const feeData = useMemo(() => {
    const paid = payments.filter((p) => p.amountPaid >= p.totalFee).length;
    const partial = payments.filter((p) => p.amountPaid > 0 && p.amountPaid < p.totalFee).length;
    const unpaid = payments.filter((p) => p.amountPaid === 0).length;
    return [
      { name: "Paid", value: paid },
      { name: "Partial", value: partial },
      { name: "Unpaid", value: unpaid },
    ].filter((d) => d.value > 0);
  }, [payments]);

  const enrollmentData = useMemo(() => {
    const levels = [
      { name: "Creche/Nursery", classes: ["Creche", "Nursery 1", "Nursery 2"] },
      { name: "KG", classes: ["KG 1", "KG 2"] },
      { name: "Primary", classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] },
      { name: "JHS", classes: ["JHS 1", "JHS 2", "JHS 3"] },
    ];
    return levels.map((l) => ({ name: l.name, students: students.filter((s) => l.classes.includes(s.class)).length }));
  }, [students]);

  const sortedEvents = useMemo(() =>
    [...eventStore.items].sort((a, b) => a.date.localeCompare(b.date)),
    [eventStore.items]
  );

  function handleAddEvent() {
    if (!eventForm.title.trim() || !eventForm.date) return;
    eventStore.add(eventForm as Omit<SchoolEvent, "id">);
    setEventOpen(false);
    setEventForm({ title: "", date: "", type: "Event" });
  }

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Welcome back, Admin 👋</h2>
          <p className="text-sm text-muted-foreground">Here's what's happening at Mujahideen Preparatory School today.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Students" value={students.length} icon={Users} trend={{ value: `${activeStudents} active`, positive: true }} />
          <StatsCard title="Teachers" value={teachers.length} icon={GraduationCap} trend={{ value: `${teachers.filter(t => t.status === "Active").length} active`, positive: true }} />
          <StatsCard title="Classes" value={classes.length} icon={School} />
          <StatsCard title="Fees Collected" value={`₵ ${totalCollected.toLocaleString()}`} icon={Wallet} trend={{ value: `${payments.length} payments`, positive: true }} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Enrollment by Level</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="students" fill="oklch(0.28 0.14 280)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Fee Collection Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={feeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {feeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
                      {s.photo ? (
                        <img src={s.photo} alt={s.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">{s.name.charAt(0)}</div>
                      )}
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
              <CardHeader className="pb-3"><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
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
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Upcoming Events</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEventOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No events. Click + to add.</p>
                  ) : sortedEvents.slice(0, 5).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 group">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                        <CalendarDays className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} • {e.type}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => eventStore.remove(e.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Event title" /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v as SchoolEvent["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEvent} disabled={!eventForm.title.trim() || !eventForm.date}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
