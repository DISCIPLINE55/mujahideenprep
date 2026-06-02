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
import { Plus, Search, Download, Pencil, Trash2, Eye, Upload, FileText } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultStudents, defaultPayments, KEYS, CLASS_LIST, updateStudentFeeStatus, type Student, type Payment, generateId, getItems, setItems } from "@/lib/storage";
import { downloadCSV } from "@/lib/export";
import { CSVImportDialog } from "@/components/CSVImportDialog";
import { TableSkeleton } from "@/components/TableSkeleton";
import { generateClassList } from "@/lib/pdf";
import { useDebounce } from "@/lib/debounce";
import { logActivity } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/students")({
  head: () => ({
    meta: [
      { title: "Students — MPSMS" },
      { name: "description", content: "Manage student records at Mujahideen Preparatory School" },
      { property: "og:title", content: "Student Management — MPSMS" },
    ],
  }),
  component: StudentsPage,
});

const GHANA_REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", 
  "Greater Accra", "North East", "Northern", "Oti", "Savannah", 
  "Upper East", "Upper West", "Volta", "Western", "Western North"
];

function compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const emptyStudent: Omit<Student, "id"> = {
  name: "", class: CLASS_LIST[0], gender: "Male", guardian: "", phone: "", dob: "", status: "Active", fees: "Unpaid", address: "", photo: "",
  bloodGroup: "", emergencyContactName: "", emergencyContactPhone: "", medicalConditions: "", admissionDate: "", religion: "", nationality: "", region: "", amountPaid: 0, nhisNumber: ""
};

function StudentsPage() {
  const store = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const paymentStore = useStore<Payment>(KEYS.PAYMENTS, defaultPayments);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [filterClass, setFilterClass] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id">>(emptyStudent);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteTo, setPromoteTo] = useState(CLASS_LIST[0]);
  const [importOpen, setImportOpen] = useState(false);
  const [pdfClass, setPdfClass] = useState<string | null>(null);

  async function handleBulkPromote() {
    if (selected.size === 0) return;
    const updated = store.items.map(s => 
      selected.has(s.id) ? { ...s, class: promoteTo } : s
    );
    
    const loader = toast.loading("Updating student classes...");
    try {
      await store.syncAll(updated);
      toast.success(`${selected.size} students promoted to ${promoteTo}`, { id: loader });
      setSelected(new Set());
      setPromoteOpen(false);
    } catch (err) {
      toast.error("Failed to promote students", { id: loader });
    }
  }

  const filtered = useMemo(() =>
    store.items.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.guardian.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchClass = filterClass === "All" || s.class === filterClass;
      const matchStatus = filterStatus === "All" || s.status === filterStatus;
      return matchSearch && matchClass && matchStatus;
    }), [store.items, debouncedSearch, filterClass, filterStatus]);

  function openAdd() { setEditing(null); setForm(emptyStudent); setErrors({}); setOpen(true); }
  function openEdit(s: Student) {
    setEditing(s);
    setForm({ 
      name: s.name, class: s.class, gender: s.gender, guardian: s.guardian, phone: s.phone, dob: s.dob || "", status: s.status, fees: s.fees, address: s.address, photo: s.photo || "",
      bloodGroup: s.bloodGroup || "", emergencyContactName: s.emergencyContactName || "", emergencyContactPhone: s.emergencyContactPhone || "", medicalConditions: s.medicalConditions || "", admissionDate: s.admissionDate || "", religion: s.religion || "", nationality: s.nationality || "", region: s.region || "", amountPaid: s.amountPaid || 0, nhisNumber: s.nhisNumber || ""
    });
    setErrors({}); setOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.guardian.trim()) e.guardian = "Guardian name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    if (editing) { 
      // Do not allow editing student form to overwrite the computed fees status!
      const { fees, ...restOfForm } = form;
      await store.update({ ...editing, ...restOfForm }); 
      logActivity(`Updated student: ${form.name}`); 
      toast.success("Student updated successfully"); 
    } else {
      const newStudent = await store.add(form);
      logActivity(`Added student: ${form.name}`); 
      toast.success("Student added successfully"); 

      if (form.amountPaid && form.amountPaid > 0) {
        const newPayment: Payment = {
          id: generateId(),
          studentId: newStudent.id,
          studentName: newStudent.name,
          class: newStudent.class,
          totalFee: 0,
          amountPaid: Number(form.amountPaid),
          date: new Date().toISOString().split("T")[0],
          description: "Initial Enrollment Fee"
        };
        await paymentStore.add(newPayment);
        
        // Dynamically update student's fee status
        const newStatus = await updateStudentFeeStatus(newStudent.id);
        const updatedStudents = store.items.map((s) => 
          s.id === newStudent.id ? { ...s, fees: newStatus } : s
        );
        store.setAll(updatedStudents);
      }
    }
    setOpen(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const loader = toast.loading("Compressing image...");
    try {
      const compressed = await compressImage(file, 200, 200, 0.7);
      setForm({ ...form, photo: compressed });
      toast.success("Image compressed!", { id: loader });
    } catch (err) {
      toast.error("Failed to process image", { id: loader });
    }
  }

  function handleDelete() {
    if (deleteId) {
      const s = store.items.find((x) => x.id === deleteId);
      store.remove(deleteId);
      if (s) logActivity(`Deleted student: ${s.name}`);
      setDeleteId(null);
      toast.success("Student deleted");
    }
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    const count = selected.size;
    selected.forEach((id) => store.remove(id));
    logActivity(`Bulk deleted ${count} students`);
    toast.success(`${count} students deleted`);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  }

  function handleExport() {
    downloadCSV("students", ["Name", "Class", "Gender", "Guardian", "Phone", "DOB", "Status", "Fees", "Address", "Region", "Blood Group", "Emergency Contact", "Emergency Phone", "Medical Conditions", "Admission Date", "Religion", "Nationality"],
      filtered.map((s) => [s.name, s.class, s.gender, s.guardian, s.phone, s.dob || "", s.status, s.fees, s.address, s.region || "", s.bloodGroup || "", s.emergencyContactName || "", s.emergencyContactPhone || "", s.medicalConditions || "", s.admissionDate || "", s.religion || "", s.nationality || ""]));
    toast.success("Filtered students exported to CSV");
  }

  async function handleBulkImport(records: Omit<Student, "id">[]) {
    for (const r of records) {
      await store.add(r);
    }
    logActivity(`Imported ${records.length} students from CSV`);
  }

  function handlePdfClassList() {
    const cls = filterClass !== "All" ? filterClass : pdfClass;
    if (!cls || cls === "All") {
      toast.error("Filter by a class first to export its list as PDF");
      return;
    }
    const studentsInClass = store.items.filter((s) => s.class === cls);
    if (studentsInClass.length === 0) { toast.error("No students in this class"); return; }
    generateClassList({
      className: cls,
      students: studentsInClass.map((s) => ({ name: s.name, gender: s.gender, guardian: s.guardian, phone: s.phone, status: s.status })),
    });
    toast.success("Class list PDF downloaded");
  }

  const columns = useMemo(() => [
    {
      key: "select", header: "",
      render: (row: Student) => (
        <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
      ),
    },
    {
      key: "name", header: "Student Name",
      render: (row: Student) => (
        <Link to="/students/$studentId" params={{ studentId: row.id }} className="flex items-center gap-2 hover:underline" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {row.photo ? (
            <img src={row.photo} alt={row.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
              {row.name.charAt(0)}
            </div>
          )}
          <span className="font-medium text-foreground">{row.name}</span>
        </Link>
      ),
    },
    { key: "class" as const, header: "Class" },
    { key: "gender" as const, header: "Gender" },
    { key: "guardian" as const, header: "Guardian" },
    {
      key: "fees", header: "Fees",
      render: (row: Student) => (
        <Badge variant={row.fees === "Paid" ? "default" : row.fees === "Partial" ? "secondary" : "destructive"}>{row.fees}</Badge>
      ),
    },
    {
      key: "status", header: "Status",
      render: (row: Student) => <Badge variant={row.status === "Active" ? "default" : "secondary"}>{row.status}</Badge>,
    },
    {
      key: "actions", header: "",
      render: (row: Student) => (
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
      <TopBar title="Students" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Student Management</h2>
            <p className="text-sm text-muted-foreground">{store.items.length} total students enrolled</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.size > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/5" onClick={() => setPromoteOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Bulk Promote ({selected.size})
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete ({selected.size})
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="mr-1 h-4 w-4" /> Import CSV</Button>
            <Button variant="outline" size="sm" onClick={handlePdfClassList}><FileText className="mr-1 h-4 w-4" /> Class PDF</Button>
            <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Student</Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search students..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Classes</SelectItem>
              {CLASS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="ml-auto w-full sm:w-auto" onClick={toggleAll}>
            {selected.size > 0 && selected.size === filtered.length ? "Deselect All" : "Select All"}
          </Button>
        </div>

        {store.loading && store.items.length === 0 ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      <CSVImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleBulkImport} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Student" : "Add New Student"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
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
              <Input type="date" value={form.dob || ""} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Guardian Name *</Label>
              <Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} />
              {errors.guardian && <p className="text-xs text-destructive">{errors.guardian}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {GHANA_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact Name</Label>
              <Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Emergency Phone</Label>
              <Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>NHIS Number</Label>
              <Input value={form.nhisNumber} onChange={(e) => setForm({ ...form, nhisNumber: e.target.value })} placeholder="NHIS Identification Number" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Medical Conditions</Label>
              <Input value={form.medicalConditions} onChange={(e) => setForm({ ...form, medicalConditions: e.target.value })} placeholder="Any allergies or conditions?" />
            </div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admission Date</Label>
              <Input type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Religion</Label>
              <Input value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Amount Paid (₵) - <span className="font-normal text-muted-foreground text-xs">Syncs with Fees module</span></Label>
              <Input type="number" min="0" value={form.amountPaid || ""} onChange={(e) => setForm({ ...form, amountPaid: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                {form.photo && <img src={form.photo} alt="Preview" className="h-10 w-10 rounded-full object-cover border" />}
                <Input type="file" accept="image/*" onChange={handlePhotoChange} className="flex-1" />
              </div>
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
              <Label>Fee Status (Calculated from Payments)</Label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                <Badge variant={form.fees === "Paid" ? "default" : form.fees === "Partial" ? "secondary" : "destructive"}>
                  {form.fees}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Student?</DialogTitle></DialogHeader>
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
            const s = store.items.find(x => x.id === viewId);
            if (!s) return null;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    {s.photo ? <img src={s.photo} alt={s.name} className="h-12 w-12 rounded-full object-cover shrink-0" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">{s.name.charAt(0)}</div>}
                    <div>
                      <DialogTitle className="text-lg">{s.name}</DialogTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{s.class}</Badge>
                        <Badge variant={s.status === "Active" ? "default" : "secondary"}>{s.status}</Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{s.gender}</span></div>
                    <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{s.dob}</span></div>
                    <div><span className="text-muted-foreground">Blood Group:</span> <span className="font-medium">{s.bloodGroup || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Religion:</span> <span className="font-medium">{s.religion || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Nationality:</span> <span className="font-medium">{s.nationality || "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Admission:</span> <span className="font-medium">{s.admissionDate || "N/A"}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">NHIS Number:</span> <span className="font-medium">{s.nhisNumber || "N/A"}</span></div>
                  </div>
                  <div><span className="text-muted-foreground">Guardian:</span> <span className="font-medium">{s.guardian}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{s.phone || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{s.address || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Region:</span> <span className="font-medium">{s.region || "N/A"}</span></div>
                  
                  <div className="border-t pt-4 mt-2">
                    <p className="font-semibold text-foreground mb-2">Emergency & Medical</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Emergency Contact:</span> <br/><span className="font-medium">{s.emergencyContactName || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Emergency Phone:</span> <br/><span className="font-medium">{s.emergencyContactPhone || "N/A"}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Medical Conditions:</span> <br/><span className="font-medium">{s.medicalConditions || "None reported"}</span></div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewId(null)}>Close</Button>
                  <Link to="/students/$studentId" params={{ studentId: s.id }}><Button>View Full Profile</Button></Link>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Promote Students</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Promote selected to:</Label>
              <Select value={promoteTo} onValueChange={setPromoteTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CLASS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">This will update the class level for {selected.size} selected students. Use this for new academic year transitions.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkPromote}>Promote Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
