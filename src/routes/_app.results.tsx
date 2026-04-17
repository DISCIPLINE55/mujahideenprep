import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload, Download, Pencil, Trash2, FileText, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getItems, setItems, generateId, defaultStudents, defaultSubjects, KEYS, type Student, type Subject, type ExamResult } from "@/lib/storage";
import { downloadCSV } from "@/lib/export";
import { useDebounce } from "@/lib/debounce";
import { printReportCard } from "@/components/ReportCard";
import { callSchoolAI } from "@/lib/ai";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/results")({
  head: () => ({
    meta: [
      { title: "Results — MPSMS" },
      { name: "description", content: "Exam results and report cards for Mujahideen Preparatory School" },
      { property: "og:title", content: "Exam Results — MPSMS" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const subjects = getItems<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const [results, setResults] = useState<ExamResult[]>(() => getItems<ExamResult>(KEYS.RESULTS, []));
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExamResult | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => results.filter((r) =>
    r.studentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    r.class.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [results, debouncedSearch]);

  function openAdd() { setEditing(null); setSelectedStudent(""); setScores({}); setRemarks(""); setOpen(true); }
  function openEdit(r: ExamResult) {
    setEditing(r); setSelectedStudent(r.studentId);
    const s: Record<string, number> = {};
    r.subjects.forEach((sub) => { s[sub.name] = sub.score; });
    setScores(s); setRemarks(""); setOpen(true);
  }

  function handleSave() {
    if (!selectedStudent) return;
    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;
    const subjectScores = Object.entries(scores).filter(([, v]) => v > 0).map(([name, score]) => ({ name, score: Math.min(100, Math.max(0, score)) }));
    const total = subjectScores.reduce((s, sub) => s + sub.score, 0);
    const average = subjectScores.length > 0 ? Math.round(total / subjectScores.length) : 0;

    if (editing) {
      const updated = results.map((r) => r.id === editing.id ? { ...r, studentId: selectedStudent, studentName: student.name, class: student.class, subjects: subjectScores, total, average } : r);
      setItems(KEYS.RESULTS, updated); setResults(updated);
      toast.success("Scores updated");
    } else {
      const newResult: ExamResult = { id: generateId(), studentId: selectedStudent, studentName: student.name, class: student.class, term: "Term 2", subjects: subjectScores, total, average };
      const updated = [...results, newResult];
      setItems(KEYS.RESULTS, updated); setResults(updated);
      toast.success("Scores saved");
    }
    setOpen(false);
  }

  function handleDelete() {
    if (deleteId) {
      const updated = results.filter((r) => r.id !== deleteId);
      setItems(KEYS.RESULTS, updated); setResults(updated); setDeleteId(null);
      toast.success("Result deleted");
    }
  }

  function handleExport() {
    downloadCSV("results", ["Student", "Class", "Term", "Total", "Average", "Subjects"],
      results.map((r) => [r.studentName, r.class, r.term, String(r.total), String(r.average), r.subjects.map(s => `${s.name}:${s.score}`).join("; ")]));
    toast.success("Results exported to CSV");
  }

  // Compute positions
  const { positions, classCounts } = useMemo(() => {
    const pos = new Map<string, number>();
    const counts = new Map<string, number>();
    const byClass = new Map<string, ExamResult[]>();
    results.forEach((r) => { if (!byClass.has(r.class)) byClass.set(r.class, []); byClass.get(r.class)!.push(r); });
    byClass.forEach((classResults, cls) => {
      counts.set(cls, classResults.length);
      classResults.sort((a, b) => b.average - a.average);
      classResults.forEach((r, i) => pos.set(r.id, i + 1));
    });
    return { positions: pos, classCounts: counts };
  }, [results]);

  function positionLabel(n: number) {
    if (n === 1) return "1st"; if (n === 2) return "2nd"; if (n === 3) return "3rd"; return `${n}th`;
  }

  const columns = useMemo(() => [
    { key: "studentName", header: "Student", render: (row: ExamResult) => <span className="font-medium text-foreground">{row.studentName}</span> },
    { key: "class" as const, header: "Class" },
    { key: "total" as const, header: "Total" },
    {
      key: "average", header: "Average",
      render: (row: ExamResult) => <Badge variant={row.average >= 80 ? "default" : row.average >= 60 ? "secondary" : "destructive"}>{row.average}%</Badge>,
    },
    {
      key: "position", header: "Position",
      render: (row: ExamResult) => <span className="font-medium">{positionLabel(positions.get(row.id) ?? 0)}</span>,
    },
    {
      key: "actions", header: "Actions",
      render: (row: ExamResult) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Print Report Card" onClick={(e) => { e.stopPropagation(); printReportCard({ result: row, position: positions.get(row.id) ?? 0, totalInClass: classCounts.get(row.class) ?? 0 }); }}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], [positions, classCounts]);

  return (
    <>
      <TopBar title="Results" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Exam Results</h2>
            <p className="text-sm text-muted-foreground">Term 2, 2025/2026 Academic Year • {results.length} results recorded</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
            <Button size="sm" onClick={openAdd}><Upload className="mr-1 h-4 w-4" /> Upload Scores</Button>
          </div>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search results..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {results.length > 0 ? (
          <DataTable columns={columns} data={filtered} />
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No results recorded yet. Click "Upload Scores" to add exam results.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Scores" : "Upload Exam Scores"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.filter(s => s.status === "Active").map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.class}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedStudent && (
              <div className="space-y-3">
                <Label>Subject Scores (0–100)</Label>
                {subjects.filter(s => s.status === "Active").map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground">{sub.name}</span>
                    <Input type="number" min="0" max="100" className="w-20 h-8 text-sm" value={scores[sub.name] ?? ""} onChange={(e) => setScores({ ...scores, [sub.name]: Number(e.target.value) })} placeholder="0" />
                  </div>
                ))}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Teacher's Remarks</Label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={aiLoading || Object.values(scores).filter(v => v > 0).length === 0} onClick={async () => {
                      const student = students.find(s => s.id === selectedStudent);
                      if (!student) return;
                      setAiLoading(true);
                      try {
                        const subjectScores = Object.entries(scores).filter(([, v]) => v > 0).map(([n, s]) => `${n}: ${s}`).join(", ");
                        const text = await callSchoolAI({
                          type: "report_comment",
                          prompt: `Student: ${student.name} (${student.class}). Scores — ${subjectScores}. Write a personalized teacher's remark.`,
                        });
                        setRemarks(text.trim());
                        toast.success("AI remark generated");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "AI failed");
                      }
                      setAiLoading(false);
                    }}>
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      AI Generate
                    </Button>
                  </div>
                  <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional teacher remarks..." />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!selectedStudent}>{editing ? "Update" : "Save Scores"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Result?</DialogTitle></DialogHeader>
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
