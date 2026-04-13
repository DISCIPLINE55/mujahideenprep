import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultClasses, defaultStudents, KEYS, type SchoolClass, type Student, getItems } from "@/lib/storage";

export const Route = createFileRoute("/_app/classes")({
  head: () => ({ meta: [{ title: "Classes — MPSMS" }, { name: "description", content: "Manage classes" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const store = useStore<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState({ name: "", teacher: "", capacity: 30 });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() { setEditing(null); setForm({ name: "", teacher: "", capacity: 30 }); setOpen(true); }
  function openEdit(c: SchoolClass) { setEditing(c); setForm({ name: c.name, teacher: c.teacher, capacity: c.capacity }); setOpen(true); }
  function handleSave() {
    if (!form.name.trim()) return;
    if (editing) store.update({ ...editing, ...form }); else store.add(form as Omit<SchoolClass, "id">);
    setOpen(false);
  }
  function handleDelete() { if (deleteId) { store.remove(deleteId); setDeleteId(null); } }

  function countStudents(className: string) {
    return students.filter((s) => s.class === className).length;
  }

  return (
    <>
      <TopBar title="Classes" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Class Management</h2>
            <p className="text-sm text-muted-foreground">{store.items.length} classes • Creche to JHS 3</p>
          </div>
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Class</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {store.items.map((c) => {
            const count = countStudents(c.name);
            const pct = Math.round((count / (c.capacity || 1)) * 100);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{c.teacher || "No teacher assigned"}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">{count}</span>
                    <span className="text-muted-foreground">/ {c.capacity} students</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Class" : "Add Class"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Class Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Primary 1" /></div>
            <div className="space-y-2"><Label>Class Teacher</Label><Input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} /></div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add Class"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Class?</DialogTitle></DialogHeader>
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
