import { useState, useMemo } from "react";
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
import { Plus, Search, Download, Receipt, TrendingDown, Landmark, Calendar, Pencil, Trash2 } from "lucide-react";
import { getItems, setItems, generateId, KEYS, type Expense } from "@/lib/storage";
import { downloadCSV } from "@/lib/export";
import { useDebounce } from "@/lib/debounce";
import { logActivity, getAuthSync } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — MPSMS" },
      { name: "description", content: "School expenditure tracking for Mujahideen Preparatory School" },
    ],
  }),
  component: ExpensesPage,
});

const CATEGORIES = ["Salary", "Utilities", "Maintenance", "Supplies", "Food", "Books", "Marketing", "Other"];

function ExpensesPage() {
  const auth = getAuthSync();
  const isAdmin = auth?.role === "admin";
  const [allExpenses, setExpenses] = useState<Expense[]>(() => getItems<Expense>(KEYS.EXPENSES, []));
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<{ category: string; amount: number; date: string; description: string; reference: string }>({ category: "Supplies", amount: 0, date: new Date().toISOString().split("T")[0], description: "", reference: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalExpenses = useMemo(() => allExpenses.reduce((s, e) => s + e.amount, 0), [allExpenses]);
  
  const filtered = useMemo(() => allExpenses.filter((e) =>
    e.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    e.category.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [allExpenses, debouncedSearch]);

  function handleSave() {
    if (editing) {
      const updated = allExpenses.map((e) => e.id === editing.id ? { ...e, ...form } : e);
      setItems(KEYS.EXPENSES, updated); setExpenses(updated);
      logActivity(`Updated expense: ${form.description}`);
      toast.success("Expense updated");
    } else {
      const newExpense: Expense = { id: generateId(), ...form };
      const updated = [newExpense, ...allExpenses];
      setItems(KEYS.EXPENSES, updated); setExpenses(updated);
      logActivity(`Recorded expense: ₵${form.amount} for ${form.description}`);
      toast.success("Expense recorded");
    }
    setOpen(false);
  }

  function handleDelete() {
    if (deleteId) {
      const updated = allExpenses.filter((e) => e.id !== deleteId);
      setItems(KEYS.EXPENSES, updated); setExpenses(updated); setDeleteId(null);
      toast.success("Expense deleted");
    }
  }

  const columns = [
    { key: "description", header: "Description", render: (row: Expense) => <span className="font-medium">{row.description}</span> },
    { key: "category", header: "Category", render: (row: Expense) => <Badge variant="outline">{row.category}</Badge> },
    { key: "amount", header: "Amount", render: (row: Expense) => <span className="text-destructive font-bold">₵ {row.amount.toLocaleString()}</span> },
    { key: "date", header: "Date" },
    { key: "reference", header: "Ref #" },
    {
      key: "actions", header: "Actions",
      render: (row: Expense) => (
        <div className="flex gap-1">
          {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(row); setForm({ ...row, reference: row.reference || "" }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>}
          {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.id)}><Trash2 className="h-4 w-4" /></Button>}
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="School Expenses" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Expenditure Tracking</h2>
            <p className="text-sm text-muted-foreground">Manage school operational costs and salaries.</p>
          </div>
          {isAdmin && <Button size="sm" onClick={() => { setEditing(null); setForm({ category: "Supplies", amount: 0, date: new Date().toISOString().split("T")[0], description: "", reference: "" }); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Record Expense</Button>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Total Monthly" value={`₵ ${totalExpenses.toLocaleString()}`} icon={Receipt} />
          <StatsCard title="Average / Day" value={`₵ ${Math.round(totalExpenses / 30).toLocaleString()}`} icon={TrendingDown} />
          <StatsCard title="Category Lead" value={allExpenses.length > 0 ? allExpenses[0].category : "N/A"} icon={Landmark} />
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        
        <DataTable columns={columns} data={filtered} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Expense" : "Record Expense"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Description *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Electricity Bill Jan" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Amount (₵) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Ref / Receipt #</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. TX-123" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.description || !form.amount}>Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Expense?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action will permanently remove the record.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
