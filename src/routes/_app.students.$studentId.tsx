import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, MapPin, Calendar, GraduationCap, ClipboardCheck, Wallet, FileText } from "lucide-react";
import { getItems, defaultStudents, defaultPayments, KEYS, type Student, type AttendanceRecord, type ExamResult, type Payment } from "@/lib/storage";

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
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const student = students.find((s) => s.id === studentId);

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

  const presentDays = attendance.filter((a) => a.status === "Present").length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
  const totalFees = payments.reduce((s, p) => s + p.totalFee, 0);

  return (
    <>
      <TopBar title={student.name} />
      <div className="p-6 space-y-6">
        <Link to="/students">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Students</Button>
        </Link>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                {student.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>{student.class}</Badge>
                  <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
                  <Badge variant={student.fees === "Paid" ? "default" : student.fees === "Partial" ? "secondary" : "destructive"}>{student.fees}</Badge>
                </div>
                <div className="grid gap-2 mt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> {student.gender}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {student.dob}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {student.phone}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {student.address}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2"><GraduationCap className="h-4 w-4 inline mr-1" /> Guardian: {student.guardian}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
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

        {/* Exam Results */}
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
                          <span className="font-medium">{s.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment records.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.description || "Payment"}</p>
                      <p className="text-xs text-muted-foreground">{p.date || "No date"}</p>
                    </div>
                    <span className="font-medium text-foreground">₵ {p.amountPaid.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance History */}
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
      </div>
    </>
  );
}
