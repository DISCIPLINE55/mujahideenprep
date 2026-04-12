import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export const Route = createFileRoute("/_app/classes")({
  head: () => ({
    meta: [
      { title: "Classes — MPSMS" },
      { name: "description", content: "Manage classes" },
    ],
  }),
  component: ClassesPage,
});

const classes = [
  { name: "Creche", teacher: "Mrs. Mariam Alhassan", students: 25, capacity: 30 },
  { name: "Nursery 1", teacher: "Mrs. Gifty Owusu", students: 28, capacity: 30 },
  { name: "Nursery 2", teacher: "Miss. Afia Mensah", students: 30, capacity: 35 },
  { name: "KG 1", teacher: "Mrs. Abena Koomson", students: 32, capacity: 35 },
  { name: "KG 2", teacher: "Mrs. Ama Tawiah", students: 35, capacity: 40 },
  { name: "Primary 1", teacher: "Mr. Kofi Ansah", students: 38, capacity: 40 },
  { name: "Primary 2", teacher: "Mrs. Esi Baah", students: 36, capacity: 40 },
  { name: "Primary 3", teacher: "Mr. Yaw Mensah", students: 34, capacity: 40 },
  { name: "Primary 4", teacher: "Mrs. Akosua Darko", students: 40, capacity: 45 },
  { name: "Primary 5", teacher: "Mr. Kwesi Appiah", students: 38, capacity: 45 },
  { name: "Primary 6", teacher: "Mrs. Efua Gyamfi", students: 42, capacity: 45 },
  { name: "JHS 1", teacher: "Mr. Kwadwo Asare", students: 45, capacity: 50 },
  { name: "JHS 2", teacher: "Miss. Esi Kumah", students: 43, capacity: 50 },
  { name: "JHS 3", teacher: "Mr. Ibrahim Tanko", students: 48, capacity: 50 },
];

function ClassesPage() {
  return (
    <>
      <TopBar title="Classes" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Class Management</h2>
            <p className="text-sm text-muted-foreground">
              {classes.length} classes • Creche to JHS 3
            </p>
          </div>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Class
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((c) => {
            const pct = Math.round((c.students / c.capacity) * 100);
            return (
              <Card key={c.name} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <Badge variant={pct >= 90 ? "destructive" : pct >= 70 ? "secondary" : "default"}>
                      {pct}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{c.teacher}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{c.students}</span>
                    <span className="text-muted-foreground">/ {c.capacity} students</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
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
