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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultTeachers, KEYS, type Teacher } from "@/lib/storage";

export const Route = createFileRoute("/_app/teachers")({
  head: () => ({
    meta: [{ title: "Teachers — MPSMS" }, { name: "description", content: "Manage teachers" }],
  }),
  component: TeachersPage,
});

const emptyTeacher: Omit<Teacher, "id"> = {
  name: "", subject: "", classes: "", phone: "", email: "", qualification: "", status: "Active",
};

function TeachersPage() {
  const store = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, "id">>(emptyTeacher);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = store.items.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setEditing(null); setForm(emptyTeacher); setOpen(true); }
  function openEdit(t: Teacher) { setEditing(t); setForm({ name: t.name, subject: t.subject, classes: t.classes, phone: t.phone, email: t.email, qualification: t.qualification, status: t.status }); setOpen(true); }
  function handleSave() {
    if (!form.name.trim()) return;
    if (editing) store.update({ ...editing, ...form }); else store.add(form);
    setOpen(false);
  }
  function handleDelete() { if (deleteId) { store.remove(deleteId); setDeleteId(null); } }

  const columns = [
    {
      key: "name", header: "Teacher Name",
      render: (row: Teacher) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
            {row.name.split(" ").pop()?.charAt(0)}
          </div>
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    { key: "subject" as const, header: "Subject" },
    { key: "classes" as const, header: "Classes" },
    { key: "phone" as const, header: "Phone" },
    { key: "qualification" as const, header: "Qualification" },
    {
      key: "status", header: "Status",
      render: (row: Teacher) => <Badge variant={row.status === "Active" ? "default" : "secondary"}>{row.status}</Badge>,
    },
    {
      key: "actions", header: "Actions",
      render: (row: Teacher) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Teachers" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Teacher Management</h2>
            <p className="text-sm text-muted-foreground">{store.items.length} teachers on staff</p>
          </div>
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Teacher</Button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DataTable columns={columns} data={filtered} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="space-y-2"><Label>Classes Assigned</Label><Input value={form.classes} onChange={(e) => setForm({ ...form, classes: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add Teacher"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Teacher?</DialogTitle></DialogHeader>
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
