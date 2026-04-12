import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Download } from "lucide-react";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — MPSMS" },
      { name: "description", content: "Track student attendance" },
    ],
  }),
  component: AttendancePage,
});

const attendanceData = [
  { class: "Creche", present: 22, absent: 2, late: 1, total: 25 },
  { class: "Nursery 1", present: 25, absent: 2, late: 1, total: 28 },
  { class: "Nursery 2", present: 27, absent: 2, late: 1, total: 30 },
  { class: "KG 1", present: 30, absent: 1, late: 1, total: 32 },
  { class: "KG 2", present: 32, absent: 2, late: 1, total: 35 },
  { class: "Primary 1", present: 35, absent: 2, late: 1, total: 38 },
  { class: "Primary 2", present: 33, absent: 2, late: 1, total: 36 },
  { class: "Primary 3", present: 31, absent: 2, late: 1, total: 34 },
  { class: "Primary 4", present: 37, absent: 2, late: 1, total: 40 },
  { class: "Primary 5", present: 35, absent: 2, late: 1, total: 38 },
  { class: "Primary 6", present: 39, absent: 2, late: 1, total: 42 },
  { class: "JHS 1", present: 41, absent: 3, late: 1, total: 45 },
  { class: "JHS 2", present: 40, absent: 2, late: 1, total: 43 },
  { class: "JHS 3", present: 44, absent: 3, late: 1, total: 48 },
];

function AttendancePage() {
  return (
    <>
      <TopBar title="Attendance" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Attendance Overview</h2>
            <p className="text-sm text-muted-foreground">Today — April 12, 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button size="sm">
              <ClipboardCheck className="mr-1 h-4 w-4" /> Mark Attendance
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {attendanceData.map((a) => {
            const pct = Math.round((a.present / a.total) * 100);
            return (
              <Card key={a.class}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{a.class}</CardTitle>
                    <Badge variant={pct >= 90 ? "default" : "secondary"}>{pct}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={pct} className="h-2 mb-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-success font-medium">{a.present} present</span>
                    <span className="text-destructive font-medium">{a.absent} absent</span>
                    <span className="text-warning font-medium">{a.late} late</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
