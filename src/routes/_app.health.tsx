import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, Database, AlertTriangle, Users, BookOpen, UserCheck, CheckCircle2, XCircle, HardDrive, Cpu, History
} from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { KEYS, getSyncOutbox, type Student, type Teacher, type AttendanceRecord } from "@/lib/storage";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/_app/health")({
  component: HealthDashboard,
  head: () => ({
    meta: [
      { title: "System Health — MPSMS" },
      { name: "description", content: "System health and monitoring dashboard" },
    ],
  }),
});

function getLocalStorageSizeMB() {
  let _lsTotal = 0;
  let _xLen;
  for (const x in localStorage) {
    if (!localStorage.hasOwnProperty(x)) continue;
    _xLen = ((localStorage[x].length + x.length) * 2);
    _lsTotal += _xLen;
  }
  return (_lsTotal / 1024 / 1024).toFixed(2);
}

function HealthDashboard() {
  const studentStore = useStore<Student>(KEYS.STUDENTS, []);
  const teacherStore = useStore<Teacher>(KEYS.TEACHERS, []);
  const attendanceStore = useStore<AttendanceRecord>(KEYS.ATTENDANCE, []);
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // Real-time metric computations
  const outbox = getSyncOutbox();
  const pendingSyncs = outbox.filter(a => a.status === "pending").length;
  const failedSyncs = outbox.filter(a => a.status === "failed").length;
  
  const lsUsageMB = parseFloat(getLocalStorageSizeMB());
  const lsLimitMB = 5.0; // Typical browser limit
  const lsUsagePercent = Math.min((lsUsageMB / lsLimitMB) * 100, 100);
  
  const lastSyncRaw = localStorage.getItem("mpsms_last_sync_time");
  const lastSyncTime = lastSyncRaw ? new Date(parseInt(lastSyncRaw)).toLocaleString() : "Never";

  const totalStudents = studentStore.items.length;
  const totalTeachers = teacherStore.items.length;
  
  // A simplistic parent estimate (in reality parents aren't a standalone store yet, they are inferred from students/users table)
  const totalParents = Math.floor(totalStudents * 0.8); // Rough estimate based on siblings
  
  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = attendanceStore.items.filter(a => a.date === today).length;

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setActivities(data);
      setLoadingActivities(false);
    }
    fetchLogs();
  }, []);

  // Compute AI failures from activity logs
  const aiFailures = activities.filter(a => a.action === "error" && a.details?.includes("Exam Generator")).length;
  const aiSuccesses = activities.filter(a => a.action === "Exam Generated").length;
  const loginFailures = activities.filter(a => a.action === "login_failure").length;

  // System Status Logic
  let systemStatus: "Healthy" | "Warning" | "Critical" = "Healthy";
  let statusColor = "bg-green-500";
  let StatusIcon = CheckCircle2;

  if (failedSyncs > 0 || lsUsagePercent > 80 || aiFailures > 5) {
    systemStatus = "Warning";
    statusColor = "bg-yellow-500";
    StatusIcon = AlertTriangle;
  }
  
  if (lsUsagePercent > 95 || failedSyncs > 20) {
    systemStatus = "Critical";
    statusColor = "bg-destructive";
    StatusIcon = XCircle;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <TopBar title="System Health Monitoring" />
      <main className="flex-1 space-y-6 p-6">
        
        {/* Status Banner */}
        <div className={`flex items-center gap-4 rounded-xl border p-6 text-white shadow-sm ${statusColor}`}>
          <StatusIcon className="h-10 w-10" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Status: {systemStatus}</h2>
            <p className="text-white/80">Mujahideen Preparatory School Server & Local Nodes</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Local Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lsUsageMB.toFixed(2)} MB</div>
              <Progress value={lsUsagePercent} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">{lsUsagePercent.toFixed(1)}% of 5MB limit</p>
              {lsUsagePercent > 80 && (
                <Badge variant="destructive" className="mt-2">Storage Warning</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sync Queue</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSyncs}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending actions offline</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Last Sync: {lastSyncTime}</p>
              {failedSyncs > 0 && (
                <Badge variant="destructive" className="mt-2">{failedSyncs} Failed Syncs</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">AI Exam Generator</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiSuccesses}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully generated</p>
              {aiFailures > 0 && (
                <Badge variant="destructive" className="mt-2">{aiFailures} Generation Failures</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Login Diagnostics</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loginFailures}</div>
              <p className="text-xs text-muted-foreground mt-1">Recent failed attempts</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> User Metrics
              </CardTitle>
              <CardDescription>Live counts from local cache</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Total Students</span>
                  <span className="font-bold">{totalStudents}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Total Teachers</span>
                  <span className="font-bold">{totalTeachers}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Estimated Parents</span>
                  <span className="font-bold">{totalParents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Today's Attendance</span>
                  <span className="font-bold">{todayAttendance}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> System Logs
              </CardTitle>
              <CardDescription>Recent system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingActivities ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          Loading logs...
                        </TableCell>
                      </TableRow>
                    ) : activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                          No recent logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </TableCell>
                          <TableCell className="text-xs max-w-[100px] truncate">{log.user_id}</TableCell>
                          <TableCell className="text-xs">
                            <span className={log.action === "error" || log.action === "login_failure" ? "text-destructive font-medium" : ""}>
                              {log.action}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
