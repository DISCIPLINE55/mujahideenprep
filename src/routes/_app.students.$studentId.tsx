import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Phone, MapPin, Calendar, GraduationCap, ClipboardCheck, Wallet, FileText, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { getItems, defaultStudents, defaultPayments, KEYS, type Student, type AttendanceRecord, type ExamResult, type Payment, type DisciplineRecord } from "@/lib/storage";
import { logActivity } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Profile — MPSMS" },
      { name: "description", content: "Student profile and history" },
    ],
  }),
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { studentId } = Route.useParams();
  const studentStore = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const student = studentStore.items.find((s) => s.id === studentId);
  const disciplineStore = useStore<DisciplineRecord>(KEYS.DISCIPLINE, []);

  const [discOpen, setDiscOpen] = useState(false);
  const [discForm, setDiscForm] = useState<Omit<DisciplineRecord, "id" | "studentId">>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    action: "",
    severity: "Low",
  });

  if (!student) {
    return (
      <>
        <TopBar title="Student Not Found" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Student not found.</p>
          <Link to="/students"><Button variant="outline"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Students</Button></Link>
        </div>
      </>
    );
  }

  const attendance = getItems<AttendanceRecord>(KEYS.ATTENDANCE, []).filter((a) => a.studentId === studentId);
  const results = getItems<ExamResult>(KEYS.RESULTS, []).filter((r) => r.studentId === studentId);
  const payments = getItems<Payment>(KEYS.PAYMENTS, defaultPayments).filter((p) => p.studentId === studentId);
  const studentDiscipline = disciplineStore.items.filter((d) => d.studentId === studentId);

  const presentDays = attendance.filter((a) => a.status === "Present").length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
  const totalFees = payments.reduce((s, p) => s + p.totalFee, 0);

  function handleAddDiscipline() {
    if (!discForm.description.trim()) return;
    disciplineStore.add({ ...discForm, studentId } as Omit<DisciplineRecord, "id">);
    logActivity(`Discipline record added for ${student!.name}`);
    setDiscForm({ date: new Date().toISOString().split("T")[0], description: "", action: "", severity: "Low" });
    setDiscOpen(false);
    toast.success("Record added");
  }

  function handleDeleteDiscipline(id: string) {
    disciplineStore.remove(id);
    toast.success("Record removed");
  }

  return (
    <>
      <TopBar title={student.name} />
      <div className="p-4 sm:p-6 space-y-6">
        <Link to="/students">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Students</Button>
        </Link>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {student.photo ? (
                <img src={student.photo} alt={student.name} className="h-16 w-16 rounded-full object-cover shrink-0" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  {student.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground break-words">{student.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>{student.class}</Badge>
                  <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
                  <Badge variant={student.fees === "Paid" ? "default" : student.fees === "Partial" ? "secondary" : "destructive"}>{student.fees}</Badge>
                </div>
                <div className="grid gap-2 mt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4 shrink-0" /> {student.gender}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 shrink-0" /> {student.dob}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 shrink-0" /> {student.phone || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{student.address || "N/A"}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span className="font-medium">Region:</span> {student.region || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span className="font-medium">Blood:</span> {student.bloodGroup || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span className="font-medium text-foreground">Religion:</span> {student.religion || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span className="font-medium text-foreground">Nationality:</span> {student.nationality || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span className="font-medium text-foreground">Admission:</span> {student.admissionDate || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><span className="font-medium text-foreground text-[#1B1464]">NHIS #:</span> <Badge variant="outline" className="font-bold border-[#1B1464]/30">{student.nhisNumber || "Not Provided"}</Badge></div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-foreground mb-2">Emergency & Medical</p>
                  <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3 text-muted-foreground">
                    <div><span className="font-medium text-foreground">Guardian:</span> {student.guardian}</div>
                    <div><span className="font-medium text-foreground">Emergency Contact:</span> {student.emergencyContactName || "N/A"}</div>
                    <div><span className="font-medium text-foreground">Emergency Phone:</span> {student.emergencyContactPhone || "N/A"}</div>
                    <div className="sm:col-span-2 lg:col-span-3"><span className="font-medium text-foreground">Medical Conditions:</span> {student.medicalConditions || "None reported"}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <ClipboardCheck className="h-8 w-8 mx-auto text-info mb-2" />
              <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
              <p className="text-xs text-muted-foreground">Attendance ({presentDays}/{totalDays} days)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-secondary mb-2" />
              <p className="text-2xl font-bold text-foreground">{results.length > 0 ? results[results.length - 1].average + "%" : "N/A"}</p>
              <p className="text-xs text-muted-foreground">Latest Average ({results.length} exams)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Wallet className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="text-2xl font-bold text-foreground">₵ {totalPaid.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Paid of ₵ {totalFees.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="discipline" className="relative">
              Discipline
              {studentDiscipline.length > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">
                  {studentDiscipline.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Exam Results</CardTitle></CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No exam results recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {results.map((r) => (
                      <div key={r.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{r.term}</span>
                          <Badge variant={r.average >= 70 ? "default" : "secondary"}>{r.average}%</Badge>
                        </div>
                        <div className="grid gap-1 text-sm">
                          {r.subjects.map((s) => (
                            <div key={s.name} className="flex justify-between">
                              <span className="text-muted-foreground">{s.name}</span>
                              <span className="font-medium">{s.total}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payment records.</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.description || "Payment"}</p>
                          <p className="text-xs text-muted-foreground">{p.date || "No date"}</p>
                        </div>
                        <span className="font-medium text-foreground shrink-0">₵ {p.amountPaid.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Attendance</CardTitle></CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attendance.slice(-30).map((a) => (
                      <Badge key={a.id} variant={a.status === "Present" ? "default" : a.status === "Late" ? "secondary" : "destructive"} className="text-xs">
                        {a.date} — {a.status}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discipline" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Discipline Records
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setDiscOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Record
                </Button>
              </CardHeader>
              <CardContent>
                {studentDiscipline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No discipline records — keep up the good behaviour!</p>
                ) : (
                  <div className="space-y-3">
                    {[...studentDiscipline].reverse().map((d) => (
                      <div key={d.id} className="rounded-lg border p-4 group">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={d.severity === "High" ? "destructive" : d.severity === "Medium" ? "secondary" : "outline"}>{d.severity}</Badge>
                            <span className="text-xs text-muted-foreground">{d.date}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteDiscipline(d.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="text-sm text-foreground"><strong>Incident:</strong> {d.description}</p>
                        {d.action && <p className="text-sm text-muted-foreground mt-1"><strong>Action taken:</strong> {d.action}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={discOpen} onOpenChange={setDiscOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Discipline Record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={discForm.date} onChange={(e) => setDiscForm({ ...discForm, date: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={discForm.severity} onValueChange={(v) => setDiscForm({ ...discForm, severity: v as DisciplineRecord["severity"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Incident *</Label><Textarea rows={3} value={discForm.description} onChange={(e) => setDiscForm({ ...discForm, description: e.target.value })} placeholder="Describe what happened..." /></div>
            <div className="space-y-2"><Label>Action Taken</Label><Textarea rows={2} value={discForm.action} onChange={(e) => setDiscForm({ ...discForm, action: e.target.value })} placeholder="e.g. Verbal warning, parent contacted..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDiscipline} disabled={!discForm.description.trim()}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
