import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";

export const Route = createFileRoute("/_app/students")({
  head: () => ({
    meta: [
      { title: "Students — MPSMS" },
      { name: "description", content: "Manage students" },
    ],
  }),
  component: StudentsPage,
});

const students = [
  { id: "1", name: "Amina Ibrahim", class: "JHS 3", gender: "Female", guardian: "Ibrahim Mensah", status: "Active", fees: "Paid" },
  { id: "2", name: "Kwame Mensah", class: "Primary 6", gender: "Male", guardian: "Ama Mensah", status: "Active", fees: "Partial" },
  { id: "3", name: "Fatima Agyei", class: "KG 2", gender: "Female", guardian: "Kofi Agyei", status: "Active", fees: "Paid" },
  { id: "4", name: "Yusuf Osei", class: "JHS 1", gender: "Male", guardian: "Osei Bonsu", status: "Active", fees: "Unpaid" },
  { id: "5", name: "Zainab Boateng", class: "Nursery 2", gender: "Female", guardian: "Ama Boateng", status: "Active", fees: "Paid" },
  { id: "6", name: "Abdul-Rahman Tetteh", class: "Primary 3", gender: "Male", guardian: "Tetteh Quarshie", status: "Active", fees: "Paid" },
  { id: "7", name: "Halimatu Adjei", class: "JHS 2", gender: "Female", guardian: "Adjei Mensah", status: "Inactive", fees: "Unpaid" },
  { id: "8", name: "Mohammed Asante", class: "Primary 1", gender: "Male", guardian: "Asante Kofi", status: "Active", fees: "Partial" },
];

const columns = [
  {
    key: "name",
    header: "Student Name",
    render: (row: typeof students[0]) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {row.name.charAt(0)}
        </div>
        <span className="font-medium text-foreground">{row.name}</span>
      </div>
    ),
  },
  { key: "class", header: "Class" },
  { key: "gender", header: "Gender" },
  { key: "guardian", header: "Guardian" },
  {
    key: "fees",
    header: "Fees",
    render: (row: typeof students[0]) => (
      <Badge variant={row.fees === "Paid" ? "default" : row.fees === "Partial" ? "secondary" : "destructive"}>
        {row.fees}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row: typeof students[0]) => (
      <Badge variant={row.status === "Active" ? "default" : "secondary"}>
        {row.status}
      </Badge>
    ),
  },
];

function StudentsPage() {
  return (
    <>
      <TopBar title="Students" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Student Management</h2>
            <p className="text-sm text-muted-foreground">524 total students enrolled</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add Student
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" />
        </div>

        <DataTable columns={columns} data={students} />
      </div>
    </>
  );
}
