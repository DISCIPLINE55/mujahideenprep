import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { KEYS, CLASS_LIST, defaultSubjects, defaultTeachers, getItems, type Subject, type Teacher, type TimetableSlot } from "@/lib/storage";
import { callSchoolAI } from "@/lib/ai";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — MPSMS" },
      { name: "description", content: "Class timetable management" },
      { property: "og:title", content: "Timetable — MPSMS" },
    ],
  }),
  component: TimetablePage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5", "Period 6", "Period 7", "Period 8"];

function TimetablePage() {
  const store = useStore<TimetableSlot>(KEYS.TIMETABLE, []);
  const subjects = getItems<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const [selectedClass, setSelectedClass] = useState(CLASS_LIST[0]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ day: DAYS[0], period: PERIODS[0], subject: "", teacher: "", className: CLASS_LIST[0] });
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAISuggest() {
    setAiOpen(true); setAiText(""); setAiLoading(true);
    try {
      const filledSlots = classSlots.map((s) => `${s.day} ${s.period}: ${s.subject} (${s.teacher})`).join("; ") || "none";
      const subjectList = subjects.filter(s => s.status === "Active").map(s => s.name).join(", ");
      const teacherList = teachers.filter(t => t.status === "Active").map(t => `${t.name} (${t.subject})`).join("; ");
      const text = await callSchoolAI({
        type: "timetable_suggest",
        prompt: `Class: ${selectedClass}. Subjects available: ${subjectList}. Teachers available: ${teacherList}. Filled slots: ${filledSlots}. Suggest assignments for empty periods (Mon-Fri, Periods 1-8) avoiding teacher conflicts. Format as a clear list.`,
      });
      setAiText(text.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
      setAiOpen(false);
    }
    setAiLoading(false);
  }

  const classSlots = useMemo(
    () => store.items.filter((s) => s.className === selectedClass),
    [store.items, selectedClass]
  );

  function getSlot(day: string, period: string) {
    return classSlots.find((s) => s.day === day && s.period === period);
  }

  function handleAdd() {
    if (!form.subject) return;
    // Remove existing slot for same class/day/period
    const existing = store.items.find(
      (s) => s.className === form.className && s.day === form.day && s.period === form.period
    );
    if (existing) store.remove(existing.id);
    store.add({ day: form.day, period: form.period, subject: form.subject, teacher: form.teacher, className: form.className } as Omit<TimetableSlot, "id">);
    setOpen(false);
    toast.success("Timetable updated");
  }

  function handleDelete(id: string) {
    store.remove(id);
    toast.success("Slot removed");
  }

  function openAddForSlot(day: string, period: string) {
    setForm({ day, period, subject: "", teacher: "", className: selectedClass });
    setOpen(true);
  }

  return (
    <>
      <TopBar title="Timetable" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Class Timetable</h2>
            <p className="text-sm text-muted-foreground">Weekly schedule for each class</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAISuggest} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
              AI Suggest
            </Button>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{CLASS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-1">
              <div className="p-2 font-bold text-sm text-muted-foreground" />
              {DAYS.map((d) => (
                <div key={d} className="p-2 text-center font-bold text-sm bg-primary text-primary-foreground rounded-t-lg">{d}</div>
              ))}
              {PERIODS.map((period) => (
                <div key={period} className="contents">
                  <div className="p-2 text-xs font-medium text-muted-foreground flex items-center">{period}</div>
                  {DAYS.map((day) => {
                    const slot = getSlot(day, period);
                    return (
                      <div
                        key={`${day}-${period}`}
                        className="p-2 border rounded-lg min-h-[60px] cursor-pointer hover:bg-accent/20 transition-colors relative group"
                        onClick={() => !slot && openAddForSlot(day, period)}
                      >
                        {slot ? (
                          <div>
                            <p className="text-xs font-semibold text-foreground">{slot.subject}</p>
                            <p className="text-[10px] text-muted-foreground">{slot.teacher}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                              onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Timetable Slot</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.filter(s => s.status === "Active").map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={form.teacher} onValueChange={(v) => setForm({ ...form, teacher: v })}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>{teachers.filter(t => t.status === "Active").map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.subject}>Add Slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Timetable Suggestions — {selectedClass}</DialogTitle></DialogHeader>
          <div className="py-2">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Analysing schedule...</div>
            ) : (
              <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans">{aiText}</pre>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

