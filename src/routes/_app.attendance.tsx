import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardCheck, Download } from "lucide-react";
import { getItems, setItems, generateId, defaultStudents, defaultClasses, KEYS, CLASS_LIST, type Student, type SchoolClass, type AttendanceRecord } from "@/lib/storage";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — MPSMS" }, { name: "description", content: "Track student attendance" }] }),
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

  const today = new Date().toISOString().split("T")[0];

  function openMark() {
    setSelectedClass(CLASS_LIST[0]);
    setMarkDate(today);
    setMarkData({});
    setMarkOpen(true);
  }

  function initMarkData(cls: string) {
    const classStudents = students.filter((s) => s.class === cls && s.status === "Active");
    const existing = records.filter((r) => r.class === cls && r.date === markDate);
    const data: Record<string, "Present" | "Absent" | "Late"> = {};
    classStudents.forEach((s) => {
      const found = existing.find((r) => r.studentId === s.id);
      data[s.id] = found?.status ?? "Present";
    });
    setMarkData(data);
  }

  function handleClassChange(cls: string) {
    setSelectedClass(cls);
    initMarkData(cls);
  }

  function handleSaveAttendance() {
    const classStudents = students.filter((s) => s.class === selectedClass && s.status === "Active");
    // Remove old records for this class+date
    let updated = records.filter((r) => !(r.class === selectedClass && r.date === markDate));
    classStudents.forEach((s) => {
      updated.push({
        id: generateId(),
        studentId: s.id,
        studentName: s.name,
        class: selectedClass,
        date: markDate,
        status: markData[s.id] ?? "Present",
      });
    });
    setItems(KEYS.ATTENDANCE, updated);
    setRecords(updated);
    setMarkOpen(false);
  }

  // Summary per class for today
  function classSummary(cls: string) {
    const todayRecords = records.filter((r) => r.class === cls && r.date === today);
    const classStudents = students.filter((s) => s.class === cls && s.status === "Active");
    const total = classStudents.length;
    if (todayRecords.length === 0) return { total, present: 0, absent: 0, late: 0, marked: false };
    return {
      total,
      present: todayRecords.filter((r) => r.status === "Present").length,
      absent: todayRecords.filter((r) => r.status === "Absent").length,
      late: todayRecords.filter((r) => r.status === "Late").length,
      marked: true,
    };
  }

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
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={openMark}><ClipboardCheck className="mr-1 h-4 w-4" /> Mark Attendance</Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((c) => {
            const s = classSummary(c.name);
            const pct = s.total > 0 && s.marked ? Math.round((s.present / s.total) * 100) : 0;
            return (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{c.name}</CardTitle>
                    {s.marked ? (
                      <Badge variant={pct >= 90 ? "default" : "secondary"}>{pct}%</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not marked</Badge>
                    )}
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

      {/* Mark Attendance Dialog */}
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
