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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Download, Pencil, Trash2, Eye } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultTeachers, KEYS, type Teacher, defaultSubjects, CLASS_LIST, type Subject } from "@/lib/storage";
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
  dateOfJoining: "", employeeId: "", emergencyContact: "", specialization: "", accountNumber: "", bankName: "", bloodGroup: ""
};

function TeachersPage() {
  const store = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const subjectStore = useStore<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, "id">>(emptyTeacher);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() =>
    store.items.filter((t) =>
      t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [store.items, debouncedSearch]);

  function openAdd() { setEditing(null); setForm(emptyTeacher); setErrors({}); setOpen(true); }
  function openEdit(t: Teacher) { 
    setEditing(t); 
    setForm({ 
      name: t.name, subject: t.subject, classes: t.classes, phone: t.phone, email: t.email, qualification: t.qualification, status: t.status,
      dateOfJoining: t.dateOfJoining || "", employeeId: t.employeeId || "", emergencyContact: t.emergencyContact || "", specialization: t.specialization || "", accountNumber: t.accountNumber || "", bankName: t.bankName || "", bloodGroup: t.bloodGroup || ""
    }); 
    setErrors({}); setOpen(true); 
  }

  const selectedClasses = form.classes ? form.classes.split(", ").filter(Boolean) : [];
  function toggleClass(c: string) {
    const next = selectedClasses.includes(c) ? selectedClasses.filter((x) => x !== c) : [...selectedClasses, c];
    setForm({ ...form, classes: next.join(", ") });
  }

  const selectedSubjects = form.subject ? form.subject.split(", ").filter(Boolean) : [];
  function toggleSubject(s: string) {
    const next = selectedSubjects.includes(s) ? selectedSubjects.filter((x) => x !== s) : [...selectedSubjects, s];
    setForm({ ...form, subject: next.join(", ") });
  }

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
    downloadCSV("teachers", ["Employee ID", "Name", "Subject", "Classes", "Phone", "Email", "Qualification", "Status", "Date of Joining", "Emergency Contact", "Specialization", "Account Number", "Bank Name", "Blood Group"],
      filtered.map((t) => [t.employeeId || "", t.name, t.subject, t.classes, t.phone, t.email, t.qualification, t.status, t.dateOfJoining || "", t.emergencyContact || "", t.specialization || "", t.accountNumber || "", t.bankName || "", t.bloodGroup || ""]));
    toast.success("Filtered teachers exported to CSV");
  }

  const columns = useMemo(() => [
    {
      key: "select", header: "",
      render: (row: Teacher) => (
        <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
      ),
    },
    { key: "employeeId" as const, header: "Emp ID" },
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
      key: "actions", header: "",
      render: (row: Teacher) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewId(row.id); }}><Eye className="h-4 w-4 text-primary" /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="ml-auto w-full sm:w-auto" onClick={toggleAll}>
            {selected.size > 0 && selected.size === filtered.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <DataTable columns={columns} data={filtered} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
            <div className="space-y-2"><Label>Employee ID</Label><Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Subjects</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start overflow-hidden text-ellipsis whitespace-nowrap text-left font-normal">
                    {selectedSubjects.length > 0 ? selectedSubjects.join(", ") : <span className="text-muted-foreground">Select subjects...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-4 flex flex-col gap-3 max-h-60 overflow-y-auto">
                    {subjectStore.items.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground p-1 rounded">
                        <Checkbox checked={selectedSubjects.includes(sub.name)} onCheckedChange={() => toggleSubject(sub.name)} />
                        <span className="text-sm font-medium">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Classes Assigned</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start overflow-hidden text-ellipsis whitespace-nowrap text-left font-normal">
                    {selectedClasses.length > 0 ? selectedClasses.join(", ") : <span className="text-muted-foreground">Select classes...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-4 flex flex-col gap-3 max-h-60 overflow-y-auto">
                    {CLASS_LIST.map((c) => (
                      <label key={c} className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground p-1 rounded">
                        <Checkbox checked={selectedClasses.includes(c)} onCheckedChange={() => toggleClass(c)} />
                        <span className="text-sm font-medium">{c}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
            <div className="space-y-2"><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></div>
            <div className="space-y-2"><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
            <div className="space-y-2"><Label>Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
            <div className="space-y-2"><Label>Date of Joining</Label><Input type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Account Number</Label><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></div>
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

      <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
        <DialogContent className="max-w-md">
          {(() => {
            const t = store.items.find(x => x.id === viewId);
            if (!t) return null;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                      {t.name.split(" ").pop()?.charAt(0)}
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{t.name}</DialogTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{t.employeeId || "No ID"}</Badge>
                        <Badge variant={t.status === "Active" ? "default" : "secondary"}>{t.status}</Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{t.phone || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{t.email || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Qualification:</span> <span className="font-medium">{t.qualification || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Date of Joining:</span> <span className="font-medium">{t.dateOfJoining || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Blood Group:</span> <span className="font-medium">{t.bloodGroup || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Specialization:</span> <span className="font-medium">{t.specialization || "N/A"}</span></div>
                  </div>
                  <div><span className="text-muted-foreground">Subjects:</span> <span className="font-medium">{t.subject || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Classes Assigned:</span> <span className="font-medium">{t.classes || "N/A"}</span></div>
                  
                  <div className="border-t pt-4 mt-2">
                    <p className="font-semibold text-foreground mb-2">Financial & Emergency</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Bank Name:</span> <br/><span className="font-medium">{t.bankName || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Account No:</span> <br/><span className="font-medium">{t.accountNumber || "N/A"}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Emergency Contact:</span> <br/><span className="font-medium">{t.emergencyContact || "N/A"}</span></div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewId(null)}>Close</Button>
                  <Link to="/teachers/$teacherId" params={{ teacherId: t.id }}><Button>View Full Profile</Button></Link>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
