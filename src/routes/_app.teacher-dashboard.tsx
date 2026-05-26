import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardCheck, CalendarDays, BookOpen } from "lucide-react";
import { getItems, defaultStudents, defaultTeachers, defaultClasses, defaultEvents, defaultSubjects, KEYS, type Student, type Teacher, type SchoolClass, type AttendanceRecord, type TimetableSlot, type SchoolEvent } from "@/lib/storage";
import { getAuthSync } from "@/lib/auth";
import { useStore } from "@/hooks/use-store";

export const Route = createFileRoute("/_app/teacher-dashboard")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — MPSMS" },
      { name: "description", content: "Teacher dashboard for Mujahideen Preparatory School" },
    ],
  }),
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const auth = getAuthSync();
  // Use reactive stores loaded from Supabase
  const teacherStore = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const studentStore = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const classStore = useStore<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const timetableStore = useStore<TimetableSlot>(KEYS.TIMETABLE, []);
  const attendanceStore = useStore<AttendanceRecord>(KEYS.ATTENDANCE, []);
  const eventStore = useStore<SchoolEvent>(KEYS.EVENTS, defaultEvents);

  const teachers = teacherStore.items;
  const students = studentStore.items;
  const classes = classStore.items;
  const timetable = timetableStore.items;
  const attendance = attendanceStore.items;
  const events = eventStore.items;

  const teacher = useMemo(() => {
    if (!auth) return null;
    return teachers.find((t) => 
      t.id === auth.teacherId ||
      (auth.userId && t.user_id === auth.userId) ||
      (auth.email && t.email?.toLowerCase() === auth.email.toLowerCase())
    );
  }, [teachers, auth]);
  const teacherName = teacher?.name ?? auth?.name ?? "Teacher";

  // Parse assigned classes from teacher record (combining profile classes string and classes table)
  const assignedClassNames = useMemo(() => {
    if (!teacher) return [];
    
    // 1. Extract from the teacher's profile field (which is a comma-separated string, e.g. "Creche")
    const profileClasses = teacher.classes 
      ? teacher.classes.split(",").map(s => s.trim()).filter(Boolean) 
      : [];
      
    // 2. Extract from the classes table where they are explicitly assigned as the class teacher
    const tableClasses = classes
      .filter((c) => c.teacher === teacher.name)
      .map((c) => c.name);
      
    // Combine and deduplicate
    return Array.from(new Set([...profileClasses, ...tableClasses]));
  }, [teacher, classes]);

  const myStudents = useMemo(() =>
    students.filter((s) => assignedClassNames.includes(s.class)),
    [students, assignedClassNames]
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const todaySlots = useMemo(() =>
    timetable.filter((s) => s.teacher === teacher?.name && s.day === today),
    [timetable, teacher, today]
  );

  const todayAttendanceMarked = useMemo(() =>
    attendance.filter((r) => r.date === todayStr && assignedClassNames.includes(r.class)).length,
    [attendance, todayStr, assignedClassNames]
  );

  const upcomingEvents = useMemo(() =>
    [...events].filter((e) => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [events, todayStr]
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <TopBar title="Teacher Dashboard" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{greeting}, {teacherName} 👋</h2>
          <p className="text-sm text-muted-foreground">
            {teacher?.subject && `${teacher.subject} • `}
            {assignedClassNames.length > 0 ? `Assigned: ${assignedClassNames.join(", ")}` : "No classes assigned yet"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="My Students" value={myStudents.length} icon={Users} />
          <StatsCard title="My Classes" value={assignedClassNames.length} icon={BookOpen} />
          <StatsCard title="Today's Periods" value={todaySlots.length} icon={CalendarDays} />
          <StatsCard title="Attendance Today" value={todayAttendanceMarked} icon={ClipboardCheck} trend={{ value: "records marked", positive: true }} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Today's Timetable — {today}</CardTitle></CardHeader>
            <CardContent>
              {todaySlots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No periods scheduled for today.</p>
              ) : (
                <div className="space-y-2">
                  {todaySlots.sort((a, b) => a.period.localeCompare(b.period)).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.subject}</p>
                        <p className="text-xs text-muted-foreground">{s.className}</p>
                      </div>
                      <Badge variant="outline">{s.period}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">My Students</CardTitle></CardHeader>
            <CardContent>
              {myStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No students in your assigned classes.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {myStudents.slice(0, 10).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">{s.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.class}</p>
                        </div>
                      </div>
                      <Badge variant={s.status === "Active" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                    </div>
                  ))}
                  {myStudents.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">+{myStudents.length - 10} more students</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No upcoming events.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} • {e.type}</p>
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
