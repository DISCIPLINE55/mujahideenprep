import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Wallet, TrendingUp, AlertCircle, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { getItems, setItems, generateId, defaultStudents, defaultPayments, KEYS, type Student, type Payment } from "@/lib/storage";

export const Route = createFileRoute("/_app/fees")({
  head: () => ({ meta: [{ title: "Fees — MPSMS" }, { name: "description", content: "Fee management and payments" }] }),
  component: FeesPage,
});

function FeesPage() {
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const [payments, setPayments] = useState<Payment[]>(() => getItems<Payment>(KEYS.PAYMENTS, defaultPayments));
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState({ studentId: "", totalFee: 0, amountPaid: 0, date: "", description: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalExpected = payments.reduce((s, p) => s + p.totalFee, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);
  const outstanding = totalExpected - totalCollected;
  const fullyPaid = payments.filter((p) => p.amountPaid >= p.totalFee).length;

  const filtered = payments.filter((p) =>
    p.studentName.toLowerCase().includes(search.toLowerCase()) ||
    p.class.toLowerCase().includes(search.toLowerCase())
  );

  function getStatus(p: Payment) {
    if (p.amountPaid >= p.totalFee) return "Paid";
    if (p.amountPaid > 0) return "Partial";
    return "Unpaid";
  }

  function openAdd() {
    setEditing(null);
    setForm({ studentId: "", totalFee: 0, amountPaid: 0, date: new Date().toISOString().split("T")[0], description: "" });
    setOpen(true);
  }

  function openEdit(p: Payment) {
    setEditing(p);
    setForm({ studentId: p.studentId, totalFee: p.totalFee, amountPaid: p.amountPaid, date: p.date, description: p.description });
    setOpen(true);
  }

  function handleSave() {
    if (!form.studentId) return;
    const student = students.find((s) => s.id === form.studentId);
    if (!student) return;

    if (editing) {
      const updated = payments.map((p) => p.id === editing.id ? { ...p, ...form, studentName: student.name, class: student.class } : p);
      setItems(KEYS.PAYMENTS, updated);
      setPayments(updated);
    } else {
      const newPayment: Payment = {
        id: generateId(),
        studentId: form.studentId,
        studentName: student.name,
        class: student.class,
        totalFee: form.totalFee,
        amountPaid: form.amountPaid,
        date: form.date,
        description: form.description,
      };
      const updated = [...payments, newPayment];
      setItems(KEYS.PAYMENTS, updated);
      setPayments(updated);
    }
    setOpen(false);
  }

  function handleDelete() {
    if (deleteId) {
      const updated = payments.filter((p) => p.id !== deleteId);
      setItems(KEYS.PAYMENTS, updated);
      setPayments(updated);
      setDeleteId(null);
    }
  }

  const columns = [
    { key: "studentName", header: "Student", render: (row: Payment) => <span className="font-medium text-foreground">{row.studentName}</span> },
    { key: "class" as const, header: "Class" },
    { key: "totalFee", header: "Total Fee", render: (row: Payment) => <span>₵ {row.totalFee.toLocaleString()}</span> },
    { key: "amountPaid", header: "Paid", render: (row: Payment) => <span>₵ {row.amountPaid.toLocaleString()}</span> },
    { key: "balance", header: "Balance", render: (row: Payment) => <span className="font-medium">₵ {(row.totalFee - row.amountPaid).toLocaleString()}</span> },
    {
      key: "status", header: "Status",
      render: (row: Payment) => {
        const status = getStatus(row);
        return <Badge variant={status === "Paid" ? "default" : status === "Partial" ? "secondary" : "destructive"}>{status}</Badge>;
      },
    },
    { key: "date" as const, header: "Last Payment" },
    {
      key: "actions", header: "Actions",
      render: (row: Payment) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Fees & Finance" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Fee Management</h2>
            <p className="text-sm text-muted-foreground">Term 2, 2025/2026 Academic Year</p>
          </div>
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Record Payment</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Expected" value={`₵ ${totalExpected.toLocaleString()}`} icon={Wallet} />
          <StatsCard title="Total Collected" value={`₵ ${totalCollected.toLocaleString()}`} icon={TrendingUp} trend={{ value: `${totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0}%`, positive: true }} />
          <StatsCard title="Outstanding" value={`₵ ${outstanding.toLocaleString()}`} icon={AlertCircle} />
          <StatsCard title="Fully Paid" value={fullyPaid.toString()} icon={CheckCircle} trend={{ value: `${payments.length > 0 ? Math.round((fullyPaid / payments.length) * 100) : 0}% of records`, positive: true }} />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search payments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <DataTable columns={columns} data={filtered} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Payment" : "Record Payment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.filter(s => s.status === "Active").map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.class}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Total Fee (₵)</Label><Input type="number" value={form.totalFee} onChange={(e) => setForm({ ...form, totalFee: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Amount Paid (₵)</Label><Input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Tuition Term 2" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.studentId}>{editing ? "Update" : "Record Payment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Payment?</DialogTitle></DialogHeader>
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
