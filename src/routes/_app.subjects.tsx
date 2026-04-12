import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_app/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — MPSMS" },
      { name: "description", content: "Manage subjects" },
    ],
  }),
  component: SubjectsPage,
});

const subjects = [
  { id: "1", name: "Mathematics", code: "MATH", classes: "Primary 1 – JHS 3", teachers: 3, status: "Active" },
  { id: "2", name: "English Language", code: "ENG", classes: "Primary 1 – JHS 3", teachers: 3, status: "Active" },
  { id: "3", name: "Science", code: "SCI", classes: "Primary 4 – JHS 3", teachers: 2, status: "Active" },
  { id: "4", name: "Social Studies", code: "SOC", classes: "Primary 4 – JHS 3", teachers: 2, status: "Active" },
  { id: "5", name: "Arabic/Islamic Studies", code: "AIS", classes: "All Classes", teachers: 2, status: "Active" },
  { id: "6", name: "French", code: "FRN", classes: "JHS 1 – JHS 3", teachers: 1, status: "Active" },
  { id: "7", name: "ICT", code: "ICT", classes: "Primary 4 – JHS 3", teachers: 1, status: "Active" },
  { id: "8", name: "Creative Arts", code: "CRA", classes: "Primary 1 – Primary 6", teachers: 1, status: "Active" },
];

const columns = [
  { key: "code", header: "Code" },
  {
    key: "name",
    header: "Subject",
    render: (row: typeof subjects[0]) => <span className="font-medium text-foreground">{row.name}</span>,
  },
  { key: "classes", header: "Classes" },
  { key: "teachers", header: "Teachers" },
  {
    key: "status",
    header: "Status",
    render: (row: typeof subjects[0]) => <Badge>{row.status}</Badge>,
  },
];

function SubjectsPage() {
  return (
    <>
      <TopBar title="Subjects" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Subject Management</h2>
            <p className="text-sm text-muted-foreground">{subjects.length} subjects configured</p>
          </div>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Subject
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search subjects..." className="pl-9" />
        </div>

        <DataTable columns={columns} data={subjects} />
      </div>
    </>
  );
}
