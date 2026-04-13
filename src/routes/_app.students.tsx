import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultStudents, KEYS, CLASS_LIST, type Student } from "@/lib/storage";

export const Route = createFileRoute("/_app/students")({
  head: () => ({
    meta: [
      { title: "Students — MPSMS" },
      { name: "description", content: "Manage students" },
    ],
  }),
  component: StudentsPage,
});

const emptyStudent: Omit<Student, "id"> = {
  name: "", class: CLASS_LIST[0], gender: "Male", guardian: "", phone: "", dob: "", status: "Active", fees: "Unpaid", address: "",
};

function StudentsPage() {
  const store = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id">>(emptyStudent);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = store.items.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase()) ||
    s.guardian.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyStudent);
    setOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({ name: s.name, class: s.class, gender: s.gender, guardian: s.guardian, phone: s.phone, dob: s.dob, status: s.status, fees: s.fees, address: s.address });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editing) {
      store.update({ ...editing, ...form });
    } else {
      store.add(form);
    }
    setOpen(false);
  }

  function handleDelete() {
    if (deleteId) {
      store.remove(deleteId);
      setDeleteId(null);
    }
  }

  const columns = [
    {
      key: "name",
      header: "Student Name",
      render: (row: Student) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
            {row.name.charAt(0)}
          </div>
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    { key: "class" as const, header: "Class" },
    { key: "gender" as const, header: "Gender" },
    { key: "guardian" as const, header: "Guardian" },
    {
      key: "fees",
      header: "Fees",
      render: (row: Student) => (
        <Badge variant={row.fees === "Paid" ? "default" : row.fees === "Partial" ? "secondary" : "destructive"}>
          {row.fees}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: Student) => (
        <Badge variant={row.status === "Active" ? "default" : "secondary"}>{row.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: Student) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Students" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Student Management</h2>
            <p className="text-sm text-muted-foreground">{store.items.length} total students enrolled</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Student</Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <DataTable columns={columns} data={filtered} />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student name" />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fee Status</Label>
                <Select value={form.fees} onValueChange={(v) => setForm({ ...form, fees: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Student?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
