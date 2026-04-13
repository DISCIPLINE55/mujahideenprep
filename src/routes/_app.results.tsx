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
import { Search, Upload, Download, Pencil, Trash2 } from "lucide-react";
import { getItems, setItems, generateId, defaultStudents, defaultSubjects, KEYS, CLASS_LIST, type Student, type Subject, type ExamResult } from "@/lib/storage";

export const Route = createFileRoute("/_app/results")({
  head: () => ({ meta: [{ title: "Results — MPSMS" }, { name: "description", content: "Exam results and report cards" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const subjects = getItems<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const [results, setResults] = useState<ExamResult[]>(() => getItems<ExamResult>(KEYS.RESULTS, []));
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExamResult | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = results.filter((r) =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) ||
    r.class.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setSelectedStudent("");
    setScores({});
    setOpen(true);
  }

  function openEdit(r: ExamResult) {
    setEditing(r);
    setSelectedStudent(r.studentId);
    const s: Record<string, number> = {};
    r.subjects.forEach((sub) => { s[sub.name] = sub.score; });
    setScores(s);
    setOpen(true);
  }

  function handleSave() {
    if (!selectedStudent) return;
    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;

    const subjectScores = Object.entries(scores)
      .filter(([, v]) => v > 0)
      .map(([name, score]) => ({ name, score }));

    const total = subjectScores.reduce((s, sub) => s + sub.score, 0);
    const average = subjectScores.length > 0 ? Math.round(total / subjectScores.length) : 0;

    if (editing) {
      const updated = results.map((r) => r.id === editing.id ? { ...r, studentId: selectedStudent, studentName: student.name, class: student.class, subjects: subjectScores, total, average } : r);
      setItems(KEYS.RESULTS, updated);
      setResults(updated);
    } else {
      const newResult: ExamResult = {
        id: generateId(),
        studentId: selectedStudent,
        studentName: student.name,
        class: student.class,
        term: "Term 2",
        subjects: subjectScores,
        total,
        average,
      };
      const updated = [...results, newResult];
      setItems(KEYS.RESULTS, updated);
      setResults(updated);
    }
    setOpen(false);
  }

  function handleDelete() {
    if (deleteId) {
      const updated = results.filter((r) => r.id !== deleteId);
      setItems(KEYS.RESULTS, updated);
      setResults(updated);
      setDeleteId(null);
    }
  }

  // Compute positions within each class
  const positions = new Map<string, number>();
  const byClass = new Map<string, ExamResult[]>();
  results.forEach((r) => {
    if (!byClass.has(r.class)) byClass.set(r.class, []);
    byClass.get(r.class)!.push(r);
  });
  byClass.forEach((classResults) => {
    classResults.sort((a, b) => b.average - a.average);
    classResults.forEach((r, i) => positions.set(r.id, i + 1));
  });

  function positionLabel(n: number) {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  }

  const columns = [
    { key: "studentName", header: "Student", render: (row: ExamResult) => <span className="font-medium text-foreground">{row.studentName}</span> },
    { key: "class" as const, header: "Class" },
    { key: "total" as const, header: "Total" },
    {
      key: "average", header: "Average",
      render: (row: ExamResult) => (
        <Badge variant={row.average >= 80 ? "default" : row.average >= 60 ? "secondary" : "destructive"}>
          {row.average}%
        </Badge>
      ),
    },
    {
      key: "position", header: "Position",
      render: (row: ExamResult) => <span className="font-medium">{positionLabel(positions.get(row.id) ?? 0)}</span>,
    },
    {
      key: "actions", header: "Actions",
      render: (row: ExamResult) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

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
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Export</Button>
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
                <Label>Subject Scores</Label>
                {subjects.filter(s => s.status === "Active").map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground">{sub.name}</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20 h-8 text-sm"
                      value={scores[sub.name] ?? ""}
                      onChange={(e) => setScores({ ...scores, [sub.name]: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                ))}
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
