import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, GraduationCap, BookOpen, Users } from "lucide-react";
import { getItems, defaultTeachers, defaultClasses, defaultSubjects, KEYS, type Teacher, type SchoolClass, type Subject, type TimetableSlot } from "@/lib/storage";

export const Route = createFileRoute("/_app/teachers/$teacherId")({
  head: () => ({
    meta: [
      { title: "Teacher Profile — MPSMS" },
      { name: "description", content: "Teacher profile and details" },
      { property: "og:title", content: "Teacher Profile — MPSMS" },
    ],
  }),
  component: TeacherProfilePage,
});

function TeacherProfilePage() {
  const { teacherId } = Route.useParams();
  const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const classes = getItems<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const subjects = getItems<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const timetable = getItems<TimetableSlot>(KEYS.TIMETABLE, []);

  const teacher = teachers.find((t) => t.id === teacherId);

  if (!teacher) {
    return (
      <>
        <TopBar title="Teacher Profile" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Teacher not found.</p>
          <Link to="/teachers"><Button variant="outline" className="mt-4">Back to Teachers</Button></Link>
        </div>
      </>
    );
  }

  const assignedClasses = classes.filter((c) => c.teacher === teacher.name);
  const teacherSlots = timetable.filter((s) => s.teacher === teacher.name);

  return (
    <>
      <TopBar title="Teacher Profile" />
      <div className="p-6 space-y-6 max-w-4xl">
        <Link to="/teachers" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Teachers
        </Link>

        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shrink-0">
            {teacher.name.split(" ").pop()?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">{teacher.name}</h2>
              <Badge variant="outline">{teacher.employeeId || "No ID"}</Badge>
            </div>
            <p className="text-muted-foreground">{teacher.qualification}</p>
            <Badge variant={teacher.status === "Active" ? "default" : "secondary"} className="mt-2">{teacher.status}</Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Personal & Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{teacher.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{teacher.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{teacher.qualification || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">Subject: {teacher.subject || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">Classes: {teacher.classes || "N/A"}</span>
              </div>
              <div className="pt-2 border-t mt-2">
                <div className="grid gap-2">
                  <div className="text-sm"><span className="text-muted-foreground">Date of Joining:</span> <span className="font-medium">{teacher.dateOfJoining || "N/A"}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Specialization:</span> <span className="font-medium">{teacher.specialization || "N/A"}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Blood Group:</span> <span className="font-medium">{teacher.bloodGroup || "N/A"}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Financial & Emergency</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Bank Details</p>
                <div className="bg-secondary/20 p-3 rounded-md text-sm">
                  <p><span className="text-muted-foreground">Bank Name:</span> {teacher.bankName || "N/A"}</p>
                  <p className="mt-1"><span className="text-muted-foreground">Account No:</span> {teacher.accountNumber || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Emergency Contact</p>
                <div className="bg-destructive/10 p-3 rounded-md text-sm border border-destructive/20">
                  <p className="text-foreground">{teacher.emergencyContact || "No emergency contact provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Assigned Classes ({assignedClasses.length})</CardTitle></CardHeader>
            <CardContent>
              {assignedClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes assigned as form teacher.</p>
              ) : (
                <div className="space-y-2">
                  {assignedClasses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">Capacity: {c.capacity}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Timetable Slots ({teacherSlots.length})</CardTitle></CardHeader>
          <CardContent>
            {teacherSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timetable slots assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-muted-foreground font-medium">Day</th>
                      <th className="p-2 text-left text-muted-foreground font-medium">Period</th>
                      <th className="p-2 text-left text-muted-foreground font-medium">Subject</th>
                      <th className="p-2 text-left text-muted-foreground font-medium">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherSlots.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="p-2 text-foreground">{s.day}</td>
                        <td className="p-2 text-foreground">{s.period}</td>
                        <td className="p-2 text-foreground">{s.subject}</td>
                        <td className="p-2 text-foreground">{s.className}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
