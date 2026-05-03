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
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { getAuthSync } from "@/lib/auth";

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

const SUBJECT_COLORS: Record<string, string> = {
  "Mathematics": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  "English": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  "Science": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  "Social Studies": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  "ICT": "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  "RME": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  "Creative Arts": "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  "French": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  "Physical Education": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
};

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || "bg-secondary/10 text-secondary-foreground border-secondary/20";
}

function DroppableCell({ id, onClick, children }: { id: string, onClick?: () => void, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-2 border rounded-lg min-h-[60px] cursor-pointer transition-colors relative group ${isOver ? 'bg-primary/20 border-primary' : 'hover:bg-accent/20'}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function DraggableSlot({ id, slot, onDelete, disabled }: { id: string, slot: TimetableSlot, onDelete: () => void, disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, disabled });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className={`w-full h-full p-1.5 rounded-md border flex flex-col justify-center relative focus:outline-none transition-all ${getSubjectColor(slot.subject)}`}
    >
      <p className="text-[10px] font-bold leading-tight truncate">{slot.subject}</p>
      <p className="text-[9px] opacity-80 truncate">{slot.teacher}</p>
      {!disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-background shadow-sm rounded-full"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-2.5 w-2.5 text-destructive" />
        </Button>
      )}
    </div>
  );
}

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

  const auth = getAuthSync();
  const isAdmin = auth?.role === "admin";

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
    if (!isAdmin) return;
    setForm({ day, period, subject: "", teacher: "", className: selectedClass });
    setOpen(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!isAdmin) return;
    const { active, over } = event;
    if (!over) return;
    const sourceId = active.id as string;
    const targetId = over.id as string;

    const slot = store.items.find(s => s.id === sourceId);
    if (!slot) return;

    const [day, period] = targetId.split("-");
    if (!day || !period) return;

    const existing = store.items.find(
      (s) => s.className === selectedClass && s.day === day && s.period === period
    );
    
    if (existing && existing.id !== slot.id) {
       store.remove(existing.id);
    }

    store.update({ ...slot, day, period });
    toast.success("Timetable updated");
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
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleAISuggest} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                AI Suggest
              </Button>
            )}
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{CLASS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
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
                      const cellId = `${day}-${period}`;
                      return (
                        <DroppableCell
                          key={cellId}
                          id={cellId}
                          onClick={() => isAdmin && !slot && openAddForSlot(day, period)}
                        >
                          {slot ? (
                            <DraggableSlot
                              id={slot.id}
                              slot={slot}
                              onDelete={() => handleDelete(slot.id)}
                              disabled={!isAdmin}
                            />
                          ) : (
                            isAdmin && (
                              <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100">
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )
                          )}
                        </DroppableCell>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DndContext>
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

