import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_app/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — MPSMS" },
      { name: "description", content: "Manage teachers" },
    ],
  }),
  component: TeachersPage,
});

const teachers = [
  { id: "1", name: "Mr. Kwadwo Asare", subject: "Mathematics", classes: "JHS 1-3", phone: "024-555-0101", status: "Active" },
  { id: "2", name: "Mrs. Akosua Darko", subject: "English Language", classes: "Primary 4-6", phone: "024-555-0102", status: "Active" },
  { id: "3", name: "Mr. Ibrahim Tanko", subject: "Arabic/Islamic Studies", classes: "All Classes", phone: "024-555-0103", status: "Active" },
  { id: "4", name: "Miss. Esi Kumah", subject: "Science", classes: "JHS 1-3", phone: "024-555-0104", status: "Active" },
  { id: "5", name: "Mr. Yaw Boakye", subject: "Social Studies", classes: "Primary 4-6", phone: "024-555-0105", status: "On Leave" },
  { id: "6", name: "Mrs. Mariam Alhassan", subject: "Creche & Nursery", classes: "Creche, Nursery 1-2", phone: "024-555-0106", status: "Active" },
];

const columns = [
  {
    key: "name",
    header: "Teacher Name",
    render: (row: typeof teachers[0]) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {row.name.split(" ").pop()?.charAt(0)}
        </div>
        <span className="font-medium text-foreground">{row.name}</span>
      </div>
    ),
  },
  { key: "subject", header: "Subject" },
  { key: "classes", header: "Classes" },
  { key: "phone", header: "Phone" },
  {
    key: "status",
    header: "Status",
    render: (row: typeof teachers[0]) => (
      <Badge variant={row.status === "Active" ? "default" : "secondary"}>
        {row.status}
      </Badge>
    ),
  },
];

function TeachersPage() {
  return (
    <>
      <TopBar title="Teachers" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Teacher Management</h2>
            <p className="text-sm text-muted-foreground">32 teachers on staff</p>
          </div>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Teacher
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search teachers..." className="pl-9" />
        </div>

        <DataTable columns={columns} data={teachers} />
      </div>
    </>
  );
}
