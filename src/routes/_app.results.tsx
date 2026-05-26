import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getItems, setItems, generateId, defaultStudents, defaultSubjects, KEYS, type Student, type Subject, type ExamResult, type SchoolSettings, defaultSettings } from "@/lib/storage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGrid, ListFilter, Search, Upload, Download, Pencil, Trash2, FileText, Sparkles, Loader2, Printer, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { downloadCSV } from "@/lib/export";
import { useDebounce } from "@/lib/debounce";
import { printReportCard } from "@/components/ReportCard";
import { callSchoolAI } from "@/lib/ai";
import { toast } from "sonner";
import { getAuthSync, type UserRole } from "@/lib/auth";
import { defaultTeachers, defaultClasses, type Teacher, type SchoolClass } from "@/lib/storage";

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
  const auth = getAuthSync();
  const role: UserRole = auth?.role ?? "admin";
  const resultStore = useStore<ExamResult>(KEYS.RESULTS, []);
  const studentStore = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const teacherStore = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const classStore = useStore<SchoolClass>(KEYS.CLASSES, defaultClasses);
  const subjectStore = useStore<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const settingsStore = useStore<SchoolSettings>(KEYS.SETTINGS, [defaultSettings]);

  const allResults = resultStore.items;
  const allStudents = studentStore.items;
  const teachers = teacherStore.items;
  const classes = classStore.items;
  const subjects = subjectStore.items;
  const settings = settingsStore.items[0] || defaultSettings;

  // Grade helper
  const getGrade = (score: number) => {
    if (score >= 80) return { grade: "A1", remark: "Excellent" };
    if (score >= 70) return { grade: "B2", remark: "Very Good" };
    if (score >= 60) return { grade: "B3", remark: "Good" };
    if (score >= 55) return { grade: "C4", remark: "Credit" };
    if (score >= 50) return { grade: "C5", remark: "Credit" };
    if (score >= 45) return { grade: "C6", remark: "Credit" };
    if (score >= 40) return { grade: "D7", remark: "Pass" };
    if (score >= 35) return { grade: "E8", remark: "Pass" };
    return { grade: "F9", remark: "Fail" };
  };

  // Scope data per role
  const allowedClassNames = useMemo(() => {
    if (role === "teacher") {
      const me = teachers.find((t) => 
        t.id === auth?.teacherId ||
        (auth?.userId && t.user_id === auth.userId) ||
        (auth?.email && t.email?.toLowerCase() === auth.email.toLowerCase())
      );
      if (!me) return [];
      
      // 1. Get class names from teacher profile classes (comma-separated string, e.g. "Creche")
      const profileClasses = me.classes 
        ? me.classes.split(",").map(s => s.trim()).filter(Boolean) 
        : [];

      // 2. Get class names from classes table
      const tableClasses = classes
        .filter((c) => c.teacher === me.name)
        .map((c) => c.name);

      // Combine and deduplicate
      return Array.from(new Set([...profileClasses, ...tableClasses]));
    }
    return null; // null = all
  }, [role, teachers, classes, auth]);

  const students = useMemo(() => {
    if (role === "parent") return allStudents.filter((s) => auth?.studentIds?.includes(s.id));
    if (role === "teacher" && allowedClassNames) return allStudents.filter((s) => allowedClassNames.includes(s.class));
    return allStudents;
  }, [allStudents, role, auth, allowedClassNames]);

  const results = useMemo(() => {
    if (role === "parent") return allResults.filter((r) => auth?.studentIds?.includes(r.studentId));
    if (role === "teacher" && allowedClassNames) return allResults.filter((r) => allowedClassNames.includes(r.class));
    return allResults;
  }, [allResults, role, auth, allowedClassNames]);

  const canEdit = role === "admin" || role === "teacher";
  const canDelete = role === "admin";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExamResult | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk Entry State
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkClass, setBulkClass] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkData, setBulkData] = useState<Record<string, { class: number, exam: number }>>({});

  // Prefill bulk entry data with existing results if any
  useEffect(() => {
    if (!bulkClass || !bulkSubject) {
      setBulkData({});
      return;
    }
    const initialData: Record<string, { class: number, exam: number }> = {};
    const classStudents = allStudents.filter(s => s.class === bulkClass);
    
    classStudents.forEach(student => {
      const result = allResults.find(r => r.studentId === student.id && r.term === settings.currentTerm);
      const subData = result?.subjects.find(sub => sub.name === bulkSubject);
      
      initialData[student.id] = {
        class: subData ? Number(subData.classScore) : 0,
        exam: subData ? Number(subData.examScore) : 0
      };
    });
    
    setBulkData(initialData);
  }, [bulkClass, bulkSubject, allResults, allStudents, settings.currentTerm]);

  // Bulk Print State
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [printClass, setPrintClass] = useState("");

  function handleBulkPrint() {
    if (!printClass) return;
    const classResults = results.filter(r => r.class === printClass);
    if (classResults.length === 0) {
      toast.error("No results found for this class.");
      return;
    }

    // Sort by student name
    classResults.sort((a, b) => a.studentName.localeCompare(b.studentName));

    const win = window.open("", "_blank");
    if (win) {
      const html = classResults.map(res => {
        return `<div class="print-page">${printReportCard({ result: res, position: 0, totalInClass: 0, nhisNumber: "" }, true)}</div>`;
      }).join('<div style="page-break-after: always;"></div>');

      win.document.write(`
        <html>
          <head>
            <title>Bulk Reports - ${printClass}</title>
            <style>
              @media print { .print-page { page-break-after: always; } }
              body { margin: 0; padding: 0; }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
    setBulkPrintOpen(false);
  }

  const filtered = useMemo(() => results.filter((r) =>
    r.studentName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    r.class.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [results, debouncedSearch]);

  function openAdd() { setEditing(null); setSelectedStudent(""); setScores({}); setRemarks(""); setOpen(true); }
  function openEdit(r: ExamResult) {
    setEditing(r); setSelectedStudent(r.studentId);
    const s: Record<string, number> = {};
    r.subjects.forEach((sub) => { 
      s[`${sub.name}_class`] = sub.classScore;
      s[`${sub.name}_exam`] = sub.examScore;
    });
    setScores(s); setRemarks(""); setOpen(true);
  }

  function handleSave() {
    if (!selectedStudent) return;
    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;

    const subjectScores = subjects
      .filter(sub => scores[`${sub.name}_exam`] !== undefined || scores[`${sub.name}_class`] !== undefined)
      .map(sub => {
        const classScore = scores[`${sub.name}_class`] || 0;
        const examScore = scores[`${sub.name}_exam`] || 0;
        const weightedTotal = Math.round((classScore * (settings.classWorkWeight / 100)) + (examScore * (settings.examWeight / 100)));
        const { grade, remark } = getGrade(weightedTotal);
        return { name: sub.name, classScore, examScore, total: weightedTotal, grade, remark };
      });

    const totalScore = subjectScores.reduce((s, sub) => s + sub.total, 0);
    const average = subjectScores.length > 0 ? Math.round(totalScore / subjectScores.length) : 0;

    if (editing) {
      resultStore.update({ 
        ...editing, studentId: selectedStudent, studentName: student.name, class: student.class, 
        subjects: subjectScores, totalScore, average 
      });
      toast.success("Scores updated");
    } else {
      const newResult: ExamResult = { 
        id: generateId(), studentId: selectedStudent, studentName: student.name, class: student.class, 
        term: settings.currentTerm, subjects: subjectScores, totalScore, average 
      };
      resultStore.add(newResult);
      toast.success("Scores saved");
    }
    setOpen(false);
  }

  function handleBulkSave() {
    if (!bulkClass || !bulkSubject) return;
    
    let updatedResults = [...allResults];
    const classStudents = allStudents.filter(s => s.class === bulkClass);
    
    classStudents.forEach(student => {
      const entry = bulkData[student.id];
      if (!entry) return;

      const weightedTotal = Math.round((entry.class * (settings.classWorkWeight / 100)) + (entry.exam * (settings.examWeight / 100)));
      const { grade, remark } = getGrade(weightedTotal);
      const subjectData = { name: bulkSubject, classScore: entry.class, examScore: entry.exam, total: weightedTotal, grade, remark };

      const existingIndex = updatedResults.findIndex(r => r.studentId === student.id && r.term === settings.currentTerm);
      
      if (existingIndex > -1) {
        const result = updatedResults[existingIndex];
        const subIndex = result.subjects.findIndex(s => s.name === bulkSubject);
        const newSubjects = [...result.subjects];
        if (subIndex > -1) newSubjects[subIndex] = subjectData;
        else newSubjects.push(subjectData);
        
        const totalScore = newSubjects.reduce((s, sub) => s + sub.total, 0);
        const average = Math.round(totalScore / newSubjects.length);
        
        updatedResults[existingIndex] = { ...result, subjects: newSubjects, totalScore, average };
      } else {
        updatedResults.push({
          id: generateId(),
          studentId: student.id,
          studentName: student.name,
          class: student.class,
          term: settings.currentTerm,
          subjects: [subjectData],
          totalScore: weightedTotal,
          average: weightedTotal,
        });
      }
    });

    resultStore.syncAll(updatedResults);
    setBulkOpen(false);
    toast.success(`Bulk scores for ${bulkSubject} saved!`);
  }

  function handleDownloadTemplate() {
    if (!bulkClass || !bulkSubject) {
      toast.error("Please select a class and subject first");
      return;
    }
    const classStudents = allStudents.filter(s => s.class === bulkClass);
    if (classStudents.length === 0) {
      toast.error("No students found in this class");
      return;
    }

    const headers = ["Student ID", "Student Name", "Class Score", "Exam Score"];
    const rows = classStudents.map(s => {
      const result = allResults.find(r => r.studentId === s.id && r.term === settings.currentTerm);
      const subData = result?.subjects.find(sub => sub.name === bulkSubject);
      
      const classScore = subData?.classScore !== undefined ? String(subData.classScore) : "";
      const examScore = subData?.examScore !== undefined ? String(subData.examScore) : "";
      
      return [s.id, s.name, classScore, examScore];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MPSMS_Grading_${bulkClass.replace(/\s+/g, "_")}_${bulkSubject.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Grading template downloaded");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          toast.error("CSV file is empty");
          return;
        }

        const parsedData: Record<string, { class: number, exam: number }> = { ...bulkData };
        let matchedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const matchResult = line.match(/"[^"]*"|[^,]+/g) || [];
          const parts = matchResult.map(p => p.replace(/^"|"$/g, "").trim());

          if (parts.length < 4) continue;

          const studentId = parts[0];
          if (!studentId) continue;

          const classScore = parseFloat(parts[2]) || 0;
          const examScore = parseFloat(parts[3]) || 0;

          const belongs = allStudents.some(s => s.id === studentId && s.class === bulkClass);
          if (belongs) {
            parsedData[studentId] = { class: classScore, exam: examScore };
            matchedCount++;
          }
        }

        if (matchedCount === 0) {
          toast.error("No matching student IDs found for the selected class.");
        } else {
          setBulkData(parsedData);
          toast.success(`Loaded grades for ${matchedCount} students from CSV!`);
        }
      } catch (err) {
        toast.error("Failed to parse CSV file. Check format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleDelete() {
    if (deleteId) {
      resultStore.remove(deleteId);
      setDeleteId(null);
      toast.success("Result deleted");
    }
  }

  function handleExport() {
    downloadCSV("results", ["Student", "Class", "Term", "Total", "Average", "Subjects"],
      results.map((r) => [r.studentName, r.class, r.term, String(r.totalScore), String(r.average), r.subjects.map(s => `${s.name}:${s.total}`).join("; ")]));
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
    { key: "totalScore" as const, header: "Total" },
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
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Print Report Card" onClick={(e) => { 
            e.stopPropagation(); 
            const student = allStudents.find(s => s.id === row.studentId);
            printReportCard({ 
              result: row, 
              position: positions.get(row.id) ?? 0, 
              totalInClass: classCounts.get(row.class) ?? 0,
              nhisNumber: student?.nhisNumber
            }); 
          }}>
            <FileText className="h-4 w-4" />
          </Button>
          {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>}
          {canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4" /></Button>}
        </div>
      ),
    },
  ], [positions, classCounts, canEdit, canDelete]);

  return (
    <>
      <TopBar title="Results" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Exam Results</h2>
            <p className="text-sm text-muted-foreground">Term 2, 2025/2026 Academic Year • {results.length} results recorded</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
            <Button variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/5" onClick={() => setBulkPrintOpen(true)}>
              <Printer className="mr-1 h-4 w-4" /> Bulk Print
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" size="sm" className="text-success border-success/30 hover:bg-success/5" onClick={() => setBulkOpen(true)}>
                  <LayoutGrid className="mr-1 h-4 w-4" /> Bulk Entry
                </Button>
                <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Record Score</Button>
              </>
            )}
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
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-muted-foreground border-b pb-1">
                  <div className="col-span-6">Subject</div>
                  <div className="col-span-3 text-center">Class ({settings.classWorkWeight}%)</div>
                  <div className="col-span-3 text-center">Exam ({settings.examWeight}%)</div>
                </div>
                {subjects.filter(s => s.status === "Active").map((sub) => (
                  <div key={sub.id} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-6 text-sm">{sub.name}</span>
                    <Input type="number" className="col-span-3 h-8 text-center" 
                      value={scores[`${sub.name}_class`] ?? ""} 
                      onChange={(e) => setScores({ ...scores, [`${sub.name}_class`]: Number(e.target.value) })} 
                    />
                    <Input type="number" className="col-span-3 h-8 text-center" 
                      value={scores[`${sub.name}_exam`] ?? ""} 
                      onChange={(e) => setScores({ ...scores, [`${sub.name}_exam`]: Number(e.target.value) })} 
                    />
                  </div>
                ))}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Teacher's Remarks</Label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={aiLoading || Object.values(scores).length === 0} onClick={async () => {
                      const student = students.find(s => s.id === selectedStudent);
                      if (!student) return;
                      setAiLoading(true);
                      try {
                        const subjectScores = Object.entries(scores)
                          .filter(([k]) => k.endsWith("_exam"))
                          .map(([k, s]) => `${k.replace("_exam", "")}: ${s}`).join(", ");
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

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Gradebook — Bulk Entry</DialogTitle></DialogHeader>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b">
            <div className="flex gap-4 flex-1">
              <div className="w-1/2 space-y-2">
                <Label>Class</Label>
                <Select value={bulkClass} onValueChange={setBulkClass}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>{(allowedClassNames || defaultClasses.map(c => c.name)).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-1/2 space-y-2">
                <Label>Subject</Label>
                <Select value={bulkSubject} onValueChange={setBulkSubject}>
                  <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>{subjects.filter(s => s.status === "Active").map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            
            {bulkClass && bulkSubject && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" /> Template
                </Button>
                <div className="relative">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" /> Upload CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead className="w-[200px]">Student Name</TableHead>
                  <TableHead className="text-center">Class Score ({settings.classWorkWeight}%)</TableHead>
                  <TableHead className="text-center">Exam Score ({settings.examWeight}%)</TableHead>
                  <TableHead className="text-center">Total (100%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkClass && bulkSubject ? (
                  allStudents.filter(s => s.class === bulkClass).map(student => {
                    const entry = bulkData[student.id] || { class: 0, exam: 0 };
                    const total = Math.round((entry.class * (settings.classWorkWeight / 100)) + (entry.exam * (settings.examWeight / 100)));
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <Input type="number" className="h-8 text-center" value={entry.class || ""} onChange={(e) => setBulkData({ ...bulkData, [student.id]: { ...entry, class: Number(e.target.value) } })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="h-8 text-center" value={entry.exam || ""} onChange={(e) => setBulkData({ ...bulkData, [student.id]: { ...entry, exam: Number(e.target.value) } })} />
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {total}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Select a class and subject to begin grading.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkSave} disabled={!bulkClass || !bulkSubject}>Save Bulk Scores</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkPrintOpen} onOpenChange={setBulkPrintOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Print Report Cards</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={printClass} onValueChange={setPrintClass}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{(allowedClassNames || defaultClasses.map(c => c.name)).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">This will generate a combined document with report cards for all students in the selected class.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPrintOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkPrint} disabled={!printClass}>Generate Bulk PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
