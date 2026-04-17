import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardCheck, Download, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getItems, setItems, generateId, defaultStudents, defaultClasses, KEYS, CLASS_LIST, type Student, type SchoolClass, type AttendanceRecord } from "@/lib/storage";
import { downloadCSV } from "@/lib/export";
import { callSchoolAI } from "@/lib/ai";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — MPSMS" },
      { name: "description", content: "Track student attendance at Mujahideen Preparatory School" },
      { property: "og:title", content: "Attendance Tracking — MPSMS" },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const classes = getItems<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const [records, setRecords] = useState<AttendanceRecord[]>(() => getItems<AttendanceRecord>(KEYS.ATTENDANCE, []));
  const [markOpen, setMarkOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(CLASS_LIST[0]);
  const [markDate, setMarkDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [markData, setMarkData] = useState<Record<string, "Present" | "Absent" | "Late">>({});
  const [showSummary, setShowSummary] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function openMark() { setSelectedClass(CLASS_LIST[0]); setMarkDate(today); setMarkData({}); setMarkOpen(true); }

  function initMarkData(cls: string) {
    const classStudents = students.filter((s) => s.class === cls && s.status === "Active");
    const existing = records.filter((r) => r.class === cls && r.date === markDate);
    const data: Record<string, "Present" | "Absent" | "Late"> = {};
    classStudents.forEach((s) => { const found = existing.find((r) => r.studentId === s.id); data[s.id] = found?.status ?? "Present"; });
    setMarkData(data);
  }

  function handleClassChange(cls: string) { setSelectedClass(cls); initMarkData(cls); }

  function handleSaveAttendance() {
    const classStudents = students.filter((s) => s.class === selectedClass && s.status === "Active");
    let updated = records.filter((r) => !(r.class === selectedClass && r.date === markDate));
    classStudents.forEach((s) => {
      updated.push({ id: generateId(), studentId: s.id, studentName: s.name, class: selectedClass, date: markDate, status: markData[s.id] ?? "Present" });
    });
    setItems(KEYS.ATTENDANCE, updated); setRecords(updated); setMarkOpen(false);
    toast.success("Attendance saved");
  }

  function handleExport() {
    downloadCSV("attendance", ["Student", "Class", "Date", "Status"],
      records.map((r) => [r.studentName, r.class, r.date, r.status]));
    toast.success("Attendance exported to CSV");
  }

  function classSummary(cls: string) {
    const todayRecords = records.filter((r) => r.class === cls && r.date === today);
    const classStudents = students.filter((s) => s.class === cls && s.status === "Active");
    const total = classStudents.length;
    if (todayRecords.length === 0) return { total, present: 0, absent: 0, late: 0, marked: false };
    return { total, present: todayRecords.filter((r) => r.status === "Present").length, absent: todayRecords.filter((r) => r.status === "Absent").length, late: todayRecords.filter((r) => r.status === "Late").length, marked: true };
  }

  // Attendance summary chart data — last 7 days per class
  const summaryData = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days.map((date) => {
      const dayRecords = records.filter((r) => r.date === date);
      const present = dayRecords.filter((r) => r.status === "Present").length;
      const absent = dayRecords.filter((r) => r.status === "Absent").length;
      const late = dayRecords.filter((r) => r.status === "Late").length;
      return { date: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), present, absent, late };
    });
  }, [records]);

  const overallStats = useMemo(() => {
    const total = records.length;
    if (total === 0) return { presentPct: 0, absentPct: 0, latePct: 0 };
    return {
      presentPct: Math.round((records.filter((r) => r.status === "Present").length / total) * 100),
      absentPct: Math.round((records.filter((r) => r.status === "Absent").length / total) * 100),
      latePct: Math.round((records.filter((r) => r.status === "Late").length / total) * 100),
    };
  }, [records]);

  const classStudentsForMark = students.filter((s) => s.class === selectedClass && s.status === "Active");

  return (
    <>
      <TopBar title="Attendance" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Attendance Overview</h2>
            <p className="text-sm text-muted-foreground">Today — {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSummary(!showSummary)}>
              <BarChart3 className="mr-1 h-4 w-4" /> {showSummary ? "Hide Summary" : "Summary"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={openMark}><ClipboardCheck className="mr-1 h-4 w-4" /> Mark Attendance</Button>
          </div>
        </div>

        {showSummary && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">7-Day Attendance Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="present" fill="oklch(0.55 0.16 145)" name="Present" stackId="a" />
                      <Bar dataKey="late" fill="oklch(0.75 0.15 80)" name="Late" stackId="a" />
                      <Bar dataKey="absent" fill="oklch(0.577 0.245 27.325)" name="Absent" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Overall Rates</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Present</span><span className="font-medium text-success">{overallStats.presentPct}%</span></div>
                  <Progress value={overallStats.presentPct} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Absent</span><span className="font-medium text-destructive">{overallStats.absentPct}%</span></div>
                  <Progress value={overallStats.absentPct} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Late</span><span className="font-medium text-warning">{overallStats.latePct}%</span></div>
                  <Progress value={overallStats.latePct} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">{records.length} total records</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((c) => {
            const s = classSummary(c.name);
            const pct = s.total > 0 && s.marked ? Math.round((s.present / s.total) * 100) : 0;
            return (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    {s.marked ? <Badge variant={pct >= 90 ? "default" : "secondary"}>{pct}%</Badge> : <Badge variant="outline" className="text-muted-foreground">Not marked</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={pct} className="h-2 mb-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-success font-medium">{s.present} present</span>
                    <span className="text-destructive font-medium">{s.absent} absent</span>
                    <span className="text-warning font-medium">{s.late} late</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={selectedClass} onValueChange={handleClassChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input type="date" className="flex h-9 w-full rounded-md border bg-background px-3 text-sm" value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
              </div>
            </div>
            {classStudentsForMark.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active students in this class</p>
            ) : (
              <div className="space-y-2">
                {classStudentsForMark.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    <Select value={markData[s.id] ?? "Present"} onValueChange={(v) => setMarkData({ ...markData, [s.id]: v as "Present" | "Absent" | "Late" })}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                        <SelectItem value="Late">Late</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAttendance} disabled={classStudentsForMark.length === 0}>Save Attendance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
