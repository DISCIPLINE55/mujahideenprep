import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Printer, Sparkles, Loader2, FileText } from "lucide-react";
import { getItems, defaultStudents, defaultTeachers, defaultClasses, defaultPayments, KEYS, CLASS_LIST, type Student, type Teacher, type SchoolClass, type Payment, type AttendanceRecord, type ExamResult } from "@/lib/storage";
import { generateAttendanceSummary, generateClassList, generateFeeStatement, generateReportCard } from "@/lib/pdf";
import { toast } from "sonner";
import { stripMarkdown } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — MPSMS" },
      { name: "description", content: "Generate reports for Mujahideen Preparatory School" },
    ],
  }),
  component: ReportsPage,
});

const CHART_COLORS = ["oklch(0.28 0.14 280)", "oklch(0.55 0.22 340)", "oklch(0.85 0.20 130)", "oklch(0.75 0.15 80)", "oklch(0.45 0.18 200)"];

function ReportsPage() {
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const classes = getItems<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const payments = getItems<Payment>(KEYS.PAYMENTS, defaultPayments);
  const attendance = getItems<AttendanceRecord>(KEYS.ATTENDANCE, []);
  const results = getItems<ExamResult>(KEYS.RESULTS, []);

  const [reportType, setReportType] = useState("enrollment");
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>(CLASS_LIST[0]);

  const enrollmentData = useMemo(() =>
    CLASS_LIST.map((c) => ({ name: c, students: students.filter((s) => s.class === c).length })).filter((d) => d.students > 0),
    [students]
  );

  const feeData = useMemo(() => {
    const paid = payments.filter((p) => p.amountPaid >= p.totalFee).length;
    const partial = payments.filter((p) => p.amountPaid > 0 && p.amountPaid < p.totalFee).length;
    const unpaid = payments.filter((p) => p.amountPaid === 0).length;
    return [{ name: "Paid", value: paid }, { name: "Partial", value: partial }, { name: "Unpaid", value: unpaid }].filter((d) => d.value > 0);
  }, [payments]);

  const totalFees = payments.reduce((s, p) => s + p.totalFee, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);

  function downloadReportCard() {
    const s = students.find((x) => x.id === selectedStudentId);
    if (!s) { toast.error("Select a student first"); return; }
    const studentResults = results.filter((r) => r.studentId === s.id);
    if (studentResults.length === 0) { toast.error("No exam results recorded for this student"); return; }
    const latest = studentResults[studentResults.length - 1];
    generateReportCard({
      studentName: s.name,
      studentClass: s.class,
      term: latest?.term,
      results: (latest?.subjects || []).map((sub) => ({
        subject: sub.name,
        score: Number(sub.total) || 0,
        grade: sub.grade,
        remarks: sub.remark,
      })),
    });
    toast.success("Report card PDF downloaded");
  }

  function downloadFeeStatement() {
    const s = students.find((x) => x.id === selectedStudentId);
    if (!s) { toast.error("Select a student first"); return; }
    const studentPayments = payments.filter((p) => p.studentId === s.id);
    const totalFee = studentPayments[0]?.totalFee || 0;
    generateFeeStatement({
      studentName: s.name,
      studentClass: s.class,
      totalFee,
      payments: studentPayments.map((p) => ({ date: p.date, amount: p.amountPaid, description: p.description })),
    });
    toast.success("Fee statement PDF downloaded");
  }

  function downloadAttendancePDF() {
    const inClass = students.filter((s) => s.class === selectedClass);
    if (inClass.length === 0) { toast.error("No students in this class"); return; }
    const records = attendance.filter((a) => a.class === selectedClass);
    if (records.length === 0) { toast.error("No attendance records for this class"); return; }
    const dates = records.map((r) => r.date).sort();
    const rows = inClass.map((stu) => {
      const studentRecords = records.filter((r) => r.studentId === stu.id);
      const present = studentRecords.filter((r) => r.status === "Present").length;
      const total = studentRecords.length;
      return { studentName: stu.name, present, absent: total - present, total };
    });
    generateAttendanceSummary({
      className: selectedClass,
      fromDate: dates[0],
      toDate: dates[dates.length - 1],
      rows,
    });
    toast.success("Attendance PDF downloaded");
  }

  function downloadClassListPDF() {
    const inClass = students.filter((s) => s.class === selectedClass);
    if (inClass.length === 0) { toast.error("No students in this class"); return; }
    generateClassList({
      className: selectedClass,
      students: inClass.map((s) => ({ name: s.name, gender: s.gender, guardian: s.guardian, phone: s.phone, status: s.status })),
    });
    toast.success("Class list PDF downloaded");
  }

  const attendanceData = useMemo(() => {
    if (attendance.length === 0) return [];
    const byClass: Record<string, { present: number; total: number }> = {};
    attendance.forEach((r) => {
      if (!byClass[r.class]) byClass[r.class] = { present: 0, total: 0 };
      byClass[r.class].total++;
      if (r.status === "Present") byClass[r.class].present++;
    });
    return Object.entries(byClass).map(([name, d]) => ({ name, rate: Math.round((d.present / d.total) * 100) }));
  }, [attendance]);

  async function handleAISummary() {
    setAiLoading(true);
    try {
      const context = reportType === "enrollment"
        ? `Enrollment: ${students.length} students across ${classes.length} classes. ${students.filter(s => s.status === "Active").length} active.`
        : reportType === "fees"
        ? `Fees: Total ₵${totalFees}, Collected ₵${totalCollected}, Outstanding ₵${totalFees - totalCollected}. ${payments.length} payment records.`
        : reportType === "attendance"
        ? `Attendance: ${attendance.length} records. Data: ${JSON.stringify(attendanceData)}`
        : `Teachers: ${teachers.length} staff. ${teachers.filter(t => t.status === "Active").length} active.`;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/school-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ 
            role: "user", 
            content: `As an educational consultant for Mujahideen Preparatory School, analyze the following ${reportType} data and provide a professional executive summary. 
            Include:
            1. Key Performance Indicators (KPIs) and their current status.
            2. Identified trends or potential issues.
            3. Actionable recommendations for the school administration to improve outcomes.
            
            Keep the tone formal, encouraging, and highly professional.
            Data: ${context}` 
          }],
          type: "chat",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let result = "", buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { 
            const p = JSON.parse(json); 
            const c = p.choices?.[0]?.delta?.content; 
            if (c) {
              result += c;
              setAiSummary(stripMarkdown(result)); // Update real-time for streaming effect
            }
          } catch {}
        }
      }
    } catch {
      toast.error("Failed to generate AI summary");
    }
    setAiLoading(false);
  }

  return (
    <>
      <TopBar title="Reports" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Select value={reportType} onValueChange={(v) => { setReportType(v); setAiSummary(""); }}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="enrollment">Enrollment Report</SelectItem>
              <SelectItem value="fees">Fee Collection Report</SelectItem>
              <SelectItem value="attendance">Attendance Summary</SelectItem>
              <SelectItem value="workload">Teacher Workload</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAISummary} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              AI Summary
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Downloadable PDF Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Per-Student</p>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.class}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={downloadReportCard}><Download className="h-4 w-4 mr-1" /> Report Card</Button>
                  <Button size="sm" variant="outline" onClick={downloadFeeStatement}><Download className="h-4 w-4 mr-1" /> Fee Statement</Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Per-Class</p>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={downloadClassListPDF}><Download className="h-4 w-4 mr-1" /> Class List</Button>
                  <Button size="sm" variant="outline" onClick={downloadAttendancePDF}><Download className="h-4 w-4 mr-1" /> Attendance Summary</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {aiSummary && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Summary</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-foreground whitespace-pre-line">{aiSummary}</p></CardContent>
          </Card>
        )}

        {reportType === "enrollment" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Student Enrollment by Class</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="students" fill="oklch(0.28 0.14 280)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold text-foreground">{students.length}</p><p className="text-xs text-muted-foreground">Total Students</p></div>
                <div><p className="text-2xl font-bold text-success">{students.filter(s => s.status === "Active").length}</p><p className="text-xs text-muted-foreground">Active</p></div>
                <div><p className="text-2xl font-bold text-destructive">{students.filter(s => s.status !== "Active").length}</p><p className="text-xs text-muted-foreground">Inactive</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === "fees" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Fee Collection Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={feeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                        {feeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Expected</p><p className="text-2xl font-bold text-foreground">₵ {totalFees.toLocaleString()}</p></div>
                  <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Collected</p><p className="text-2xl font-bold text-success">₵ {totalCollected.toLocaleString()}</p></div>
                  <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-2xl font-bold text-destructive">₵ {(totalFees - totalCollected).toLocaleString()}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === "attendance" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Attendance Summary by Class</CardTitle></CardHeader>
            <CardContent>
              {attendanceData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance data recorded yet. Mark attendance first.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="rate" fill="oklch(0.55 0.22 340)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {reportType === "workload" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Teacher Workload</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teachers.map((t) => {
                  const assignedClasses = classes.filter((c) => c.teacher === t.name);
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.subject} • {t.qualification}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{assignedClasses.length} classes</Badge>
                        <Badge variant={t.status === "Active" ? "default" : "secondary"}>{t.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
