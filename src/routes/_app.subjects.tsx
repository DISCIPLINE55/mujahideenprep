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
import { defaultSubjects, KEYS, type Subject } from "@/lib/storage";

export const Route = createFileRoute("/_app/subjects")({
  head: () => ({ meta: [{ title: "Subjects — MPSMS" }, { name: "description", content: "Manage subjects" }] }),
  component: SubjectsPage,
});

const emptySubject: Omit<Subject, "id"> = { name: "", code: "", classes: "", status: "Active" };

function SubjectsPage() {
  const store = useStore<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState<Omit<Subject, "id">>(emptySubject);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = store.items.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setForm(emptySubject); setOpen(true); }
  function openEdit(s: Subject) { setEditing(s); setForm({ name: s.name, code: s.code, classes: s.classes, status: s.status }); setOpen(true); }
  function handleSave() {
    if (!form.name.trim()) return;
    if (editing) store.update({ ...editing, ...form }); else store.add(form);
    setOpen(false);
  }
  function handleDelete() { if (deleteId) { store.remove(deleteId); setDeleteId(null); } }

  const columns = [
    { key: "code" as const, header: "Code" },
    { key: "name", header: "Subject", render: (row: Subject) => <span className="font-medium text-foreground">{row.name}</span> },
    { key: "classes" as const, header: "Classes" },
    { key: "status", header: "Status", render: (row: Subject) => <Badge>{row.status}</Badge> },
    {
      key: "actions", header: "Actions",
      render: (row: Subject) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Subjects" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Subject Management</h2>
            <p className="text-sm text-muted-foreground">{store.items.length} subjects configured</p>
          </div>
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Subject</Button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search subjects..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DataTable columns={columns} data={filtered} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Subject Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. MATH" /></div>
            <div className="space-y-2"><Label>Classes</Label><Input value={form.classes} onChange={(e) => setForm({ ...form, classes: e.target.value })} placeholder="e.g. Primary 1 – JHS 3" /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add Subject"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Subject?</DialogTitle></DialogHeader>
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
