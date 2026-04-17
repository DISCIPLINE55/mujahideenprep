import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Pencil, Trash2, Eye } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultTeachers, KEYS, type Teacher } from "@/lib/storage";
import { downloadCSV } from "@/lib/export";
import { useDebounce } from "@/lib/debounce";
import { logActivity } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — MPSMS" },
      { name: "description", content: "Manage teaching staff at Mujahideen Preparatory School" },
      { property: "og:title", content: "Teacher Management — MPSMS" },
    ],
  }),
  component: TeachersPage,
});

const emptyTeacher: Omit<Teacher, "id"> = {
  name: "", subject: "", classes: "", phone: "", email: "", qualification: "", status: "Active",
};

function TeachersPage() {
  const store = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, "id">>(emptyTeacher);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() =>
    store.items.filter((t) =>
      t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [store.items, debouncedSearch]);

  function openAdd() { setEditing(null); setForm(emptyTeacher); setErrors({}); setOpen(true); }
  function openEdit(t: Teacher) { setEditing(t); setForm({ name: t.name, subject: t.subject, classes: t.classes, phone: t.phone, email: t.email, qualification: t.qualification, status: t.status }); setErrors({}); setOpen(true); }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) { store.update({ ...editing, ...form }); logActivity(`Updated teacher: ${form.name}`); toast.success("Teacher updated"); }
    else { store.add(form); logActivity(`Added teacher: ${form.name}`); toast.success("Teacher added"); }
    setOpen(false);
  }
  function handleDelete() {
    if (deleteId) {
      const t = store.items.find((x) => x.id === deleteId);
      store.remove(deleteId);
      if (t) logActivity(`Deleted teacher: ${t.name}`);
      setDeleteId(null);
      toast.success("Teacher deleted");
    }
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    const count = selected.size;
    selected.forEach((id) => store.remove(id));
    logActivity(`Bulk deleted ${count} teachers`);
    toast.success(`${count} teachers deleted`);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t) => t.id)));
  }

  function handleExport() {
    downloadCSV("teachers", ["Name", "Subject", "Classes", "Phone", "Email", "Qualification", "Status"],
      store.items.map((t) => [t.name, t.subject, t.classes, t.phone, t.email, t.qualification, t.status]));
    toast.success("Teachers exported to CSV");
  }

  const columns = useMemo(() => [
    {
      key: "select", header: "",
      render: (row: Teacher) => (
        <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
      ),
    },
    {
      key: "name", header: "Teacher Name",
      render: (row: Teacher) => (
        <Link to="/teachers/$teacherId" params={{ teacherId: row.id }} className="flex items-center gap-2 hover:underline" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
            {row.name.split(" ").pop()?.charAt(0)}
          </div>
          <span className="font-medium text-foreground">{row.name}</span>
        </Link>
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
          <Link to="/teachers/$teacherId" params={{ teacherId: row.id }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e: React.MouseEvent) => e.stopPropagation()}><Eye className="h-4 w-4" /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], [selected, filtered]);

  return (
    <>
      <TopBar title="Teachers" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Teacher Management</h2>
            <p className="text-sm text-muted-foreground">{store.items.length} teachers on staff</p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete ({selected.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Teacher</Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selected.size === filtered.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <DataTable columns={columns} data={filtered} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
            <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="space-y-2"><Label>Classes Assigned</Label><Input value={form.classes} onChange={(e) => setForm({ ...form, classes: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
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
