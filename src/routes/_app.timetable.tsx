import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, Loader2, Printer } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultStudents, defaultTeachers, KEYS, type Student, type Teacher, type TimetableSlot, type Subject, defaultSubjects, generateId, CLASS_LIST } from "@/lib/storage";
import { useAllowedClasses } from "@/hooks/use-allowed-classes";
import { callSchoolAI } from "@/lib/ai";
import { getSchoolSettings } from "@/lib/printBranding";
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

const PERIOD_TIMES: Record<string, string> = {
  "Period 1": "08:00 AM - 08:40 AM",
  "Period 2": "08:40 AM - 09:20 AM",
  "Period 3": "09:20 AM - 10:00 AM",
  "Period 4": "10:30 AM - 11:10 AM",
  "Period 5": "11:10 AM - 11:50 AM",
  "Period 6": "11:50 AM - 12:30 PM",
  "Period 7": "01:30 PM - 02:10 PM",
  "Period 8": "02:10 PM - 02:50 PM",
};

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
      className={`p-2 border rounded-lg min-h-[60px] cursor-pointer transition-colors relative group print:min-h-[55px] print:p-1.5 print:rounded-md print:border-black/25 ${isOver ? 'bg-primary/20 border-primary' : 'hover:bg-accent/20'}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function DraggableSlot({ id, slot, onDelete, disabled }: { id: string, slot: TimetableSlot, onDelete: () => void, disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, disabled });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;
  
  const auth = getAuthSync();
  const showClassName = auth?.role === "teacher";
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className={`w-full h-full p-1.5 rounded-md border flex flex-col justify-center relative focus:outline-none transition-all print:bg-white print:text-black print:border-black/30 print:shadow-none ${getSubjectColor(slot.subject)}`}
    >
      <p className="text-[10px] font-bold leading-tight truncate print:text-[10px] print:text-black">{slot.subject}</p>
      <p className="text-[9px] opacity-80 truncate print:text-[9px] print:text-black/80 print:opacity-100">{showClassName ? slot.className : slot.teacher}</p>
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
  const settings = getSchoolSettings();
  const subjectStore = useStore<Subject>(KEYS.SUBJECTS, defaultSubjects);
  const teacherStore = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const studentStore = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const subjects = subjectStore.items;
  const teachers = teacherStore.items;

  const auth = getAuthSync();
  const isAdmin = auth?.role === "admin";
  const allowedClasses = useAllowedClasses();

  const [selectedClass, setSelectedClass] = useState(() => {
    if (isAdmin) return allowedClasses[0] || CLASS_LIST[0];
    if (auth?.role === "parent") {
      const rawStudents = studentStore.items;
      const myKids = rawStudents.filter((s) => auth.studentIds?.includes(s.id));
      return myKids[0]?.class || allowedClasses[0] || CLASS_LIST[0];
    }
    return "My Schedule";
  });

  const parentClasses = useMemo(() => {
    if (auth?.role !== "parent") return [];
    const myKids = studentStore.items.filter((s) => auth.studentIds?.includes(s.id));
    const classesList = myKids.map((k) => k.class).filter(Boolean);
    return Array.from(new Set(classesList));
  }, [auth, studentStore.items]);

  const [open, setOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [form, setForm] = useState({ day: DAYS[0], period: PERIODS[0], subject: "", teacher: "", className: allowedClasses[0] || CLASS_LIST[0] });
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const parsedSuggestions = useMemo(() => {
    if (!aiText) return null;
    const match = aiText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as { day: string; period: string; subject: string; teacher: string }[];
      }
    } catch (e) {
      console.warn("Failed to parse AI suggested timetable slots:", e);
    }
    return null;
  }, [aiText]);

  const renderedAiText = useMemo(() => {
    if (!aiText) return "";
    return aiText.replace(/```json\s*([\s\S]*?)\s*```/, "").trim();
  }, [aiText]);

  async function handleAISuggest() {
    setAiOpen(true); setAiText(""); setAiLoading(true);
    try {
      const filledSlots = classSlots.map((s) => `${s.day} ${s.period}: ${s.subject} (${s.teacher})`).join("; ") || "none";
      const subjectList = subjects.filter(s => s.status === "Active").map(s => s.name).join(", ");
      const teacherList = teachers.filter(t => t.status === "Active").map(t => `${t.name} (${t.subject})`).join("; ");
      const text = await callSchoolAI({
        type: "timetable_suggest",
        prompt: `Class: ${selectedClass}. Subjects available: ${subjectList}. Teachers available: ${teacherList}. Filled slots: ${filledSlots}. Suggest assignments for empty periods (Mon-Fri, Periods 1-8) avoiding teacher conflicts. Format your recommendations as a clear, user-friendly text list, and at the very end of your response, output a valid JSON array block containing the suggested additions (for empty slots only) enclosed in \`\`\`json and \`\`\`.
Each suggestion in the JSON array must follow this exact format:
{
  "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
  "period": "Period 1" | "Period 2" | "Period 3" | "Period 4" | "Period 5" | "Period 6" | "Period 7" | "Period 8",
  "subject": "Subject Name",
  "teacher": "Teacher Name"
}`,
      });
      setAiText(text.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
      setAiOpen(false);
    }
    setAiLoading(false);
  }

  async function handleApplyAISuggestions() {
    if (!parsedSuggestions || parsedSuggestions.length === 0) return;
    const loader = toast.loading("Applying timetable suggestions...");
    try {
      const newItems = [...store.items];
      parsedSuggestions.forEach((sugg) => {
        const existingIndex = newItems.findIndex(
          (s) => s.className === selectedClass && s.day === sugg.day && s.period === sugg.period
        );
        
        const newSlot = {
          id: existingIndex >= 0 ? newItems[existingIndex].id : generateId(),
          day: sugg.day,
          period: sugg.period,
          subject: sugg.subject,
          teacher: sugg.teacher,
          className: selectedClass
        };
        
        if (existingIndex >= 0) {
          newItems[existingIndex] = newSlot;
        } else {
          newItems.push(newSlot);
        }
      });
      
      await store.syncAll(newItems);
      toast.success("AI timetable suggestions applied successfully!", { id: loader });
      setAiOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply suggestions", { id: loader });
    }
  }

  const classSlots = useMemo(() => {
    let slots = store.items;

    if (isAdmin) {
      return slots.filter((s) => s.className === selectedClass);
    }

    if (auth?.role === "parent") {
      return slots.filter((s) => s.className === selectedClass);
    }

    // Teachers filter by their own name
    const me = teachers.find((t) => 
      t.id === auth?.teacherId ||
      (auth?.userId && t.user_id === auth.userId) ||
      (auth?.email && t.email?.toLowerCase() === auth.email.toLowerCase())
    );
    if (me) {
      slots = slots.filter((s) => s.teacher === me.name);
    } else {
      slots = [];
    }
    
    if (selectedClass !== "My Schedule") {
      slots = slots.filter((s) => s.className === selectedClass);
    }
    return slots;
  }, [store.items, selectedClass, auth, teachers, isAdmin]);

  function getSlot(day: string, period: string) {
    return classSlots.find((s) => s.day === day && s.period === period);
  }

  const handleAdd = () => {
    if (!form.subject) return;

    if (editingSlotId) {
      const slot = store.items.find((s) => s.id === editingSlotId);
      if (slot) {
        store.update({ ...slot, day: form.day, period: form.period, subject: form.subject, teacher: form.teacher, className: form.className });
        toast.success("Timetable slot updated");
      }
    } else {
      // Remove existing slot for same class/day/period
      const existing = store.items.find(
        (s) => s.className === form.className && s.day === form.day && s.period === form.period
      );
      if (existing) store.remove(existing.id);
      store.add({ day: form.day, period: form.period, subject: form.subject, teacher: form.teacher, className: form.className } as Omit<TimetableSlot, "id">);
      toast.success("Timetable slot added");
    }

    setOpen(false);
    setEditingSlotId(null);
  };

  const handleDelete = (id: string) => {
    store.remove(id);
    toast.success("Slot removed");
  };

  const handleDeleteFromDialog = () => {
    if (editingSlotId) {
      store.remove(editingSlotId);
      toast.success("Slot removed");
      setOpen(false);
      setEditingSlotId(null);
    }
  };

  const openAddForSlot = (day: string, period: string) => {
    if (!isAdmin) return;
    setEditingSlotId(null);
    setForm({ day, period, subject: "", teacher: "", className: selectedClass });
    setOpen(true);
  };

  const openEditForSlot = (slot: TimetableSlot) => {
    if (!isAdmin) return;
    setEditingSlotId(slot.id);
    setForm({ day: slot.day, period: slot.period, subject: slot.subject, teacher: slot.teacher || "", className: slot.className });
    setOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-full-width {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}} />
      <TopBar title="Timetable" />
      <div className="p-6 space-y-6 print:p-0 print:space-y-4">
        {/* Printable Header */}
        <div className="hidden print:flex flex-col items-center justify-center text-center pb-4 border-b-2 border-double border-primary/20 mb-4">
          <h1 className="text-2xl font-bold tracking-wider text-primary uppercase">{settings.name || "Mujahideen Preparatory School"}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{settings.location || "Mankessim, Central Region, Ghana"}</p>
          <p className="text-[10px] text-muted-foreground">
            {settings.email ? `Email: ${settings.email}` : ""}
            {settings.email && settings.phone ? " | " : ""}
            {settings.phone ? `Tel: ${settings.phone}` : ""}
          </p>
          <h2 className="text-base font-bold mt-3 px-6 py-1 border border-primary/25 bg-muted/30 rounded-full">
            {selectedClass === "My Schedule" ? `TEACHER WEEKLY SCHEDULE: ${auth?.name || "Teacher"}` : `WEEKLY CLASS TIMETABLE: ${selectedClass}`}
          </h2>
          <p className="text-[9px] text-muted-foreground mt-1">Printed on: {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-foreground">Class Timetable</h2>
            <p className="text-sm text-muted-foreground">Weekly schedule for each class</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleAISuggest} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                AI Suggest
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print Timetable
            </Button>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {auth?.role === "parent" ? (
                  parentClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                ) : (
                  <>
                    {!isAdmin && <SelectItem value="My Schedule">My Schedule</SelectItem>}
                    {allowedClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto print:overflow-visible">
            <div className="min-w-[800px] print:min-w-0 print:w-full print:max-w-none">
              <div className="grid grid-cols-[120px_repeat(5,1fr)] print:grid-cols-[90px_repeat(5,1fr)] gap-1 print:gap-1.5 print:text-black">
                <div className="p-2 font-bold text-sm text-muted-foreground print:hidden" />
                <div className="hidden print:flex p-1 text-[11px] font-bold text-muted-foreground items-center justify-center border border-black/20 bg-muted/20">Period</div>
                {DAYS.map((d) => (
                  <div key={d} className="p-2 text-center font-bold text-sm bg-primary text-primary-foreground print:bg-muted print:text-foreground print:border print:border-black/25 rounded-t-lg print:rounded-none print:py-1.5 print:text-xs">{d}</div>
                ))}
                {PERIODS.map((period) => (
                  <div key={period} className="contents">
                    <div className="p-2 text-xs font-medium text-muted-foreground flex flex-col justify-center print:text-[10px] print:p-1 print:justify-center print:border print:border-black/25 print:bg-muted/10 print:font-bold">
                      <div className="font-semibold text-foreground leading-tight">{period}</div>
                      <div className="text-[9px] opacity-70 leading-normal">{PERIOD_TIMES[period]}</div>
                    </div>
                    {DAYS.map((day) => {
                      const slot = getSlot(day, period);
                      const cellId = `${day}-${period}`;
                      return (
                        <DroppableCell
                          key={cellId}
                          id={cellId}
                          onClick={() => {
                            if (isAdmin) {
                              if (slot) openEditForSlot(slot);
                              else openAddForSlot(day, period);
                            }
                          }}
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
          <DialogHeader><DialogTitle>{editingSlotId ? "Edit Timetable Slot" : "Add Timetable Slot"}</DialogTitle></DialogHeader>
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
          <DialogFooter className="flex items-center justify-between sm:justify-between w-full gap-2">
            {editingSlotId ? (
              <Button variant="destructive" onClick={handleDeleteFromDialog} className="cursor-pointer">Delete Slot</Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.subject} className="cursor-pointer">{editingSlotId ? "Save Changes" : "Add Slot"}</Button>
            </div>
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
              <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans">{renderedAiText}</pre>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAiOpen(false)}>Close</Button>
            {parsedSuggestions && parsedSuggestions.length > 0 && (
              <Button onClick={handleApplyAISuggestions}><Sparkles className="h-4 w-4 mr-1" /> Confirm & Apply</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

