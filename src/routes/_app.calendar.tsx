import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { defaultEvents, KEYS, type SchoolEvent } from "@/lib/storage";

export const Route = createFileRoute("/_app/calendar")({
  head: () => ({
    meta: [
      { title: "Academic Calendar — MPSMS" },
      { name: "description", content: "Academic calendar and events management" },
    ],
  }),
  component: CalendarPage,
});

const EVENT_TYPES: SchoolEvent["type"][] = ["Exam", "Meeting", "Event", "Holiday", "Other"];
const EVENT_COLORS: Record<string, string> = {
  Exam: "bg-destructive/20 text-destructive border-destructive/30",
  Meeting: "bg-info/20 text-info border-info/30",
  Event: "bg-primary/20 text-primary border-primary/30",
  Holiday: "bg-success/20 text-success border-success/30",
  Other: "bg-muted text-muted-foreground border-border",
};

function CalendarPage() {
  const eventStore = useStore<SchoolEvent>(KEYS.EVENTS, defaultEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", date: "", type: "Event" as SchoolEvent["type"] });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, SchoolEvent[]> = {};
    eventStore.items.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [eventStore.items]);

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  function handleAddEvent() {
    if (!eventForm.title.trim() || !eventForm.date) return;
    eventStore.add(eventForm as Omit<SchoolEvent, "id">);
    setEventOpen(false);
    setEventForm({ title: "", date: "", type: "Event" });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <TopBar title="Academic Calendar" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-bold text-foreground min-w-[180px] text-center">{monthName}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button size="sm" onClick={() => setEventOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Event</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-px">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
                const dayEvents = day ? eventsByDate[dateStr] || [] : [];
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={i}
                    className={`min-h-[80px] rounded-lg border p-1.5 ${
                      day ? "bg-background" : "bg-transparent border-transparent"
                    } ${isToday ? "ring-2 ring-primary" : ""}`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-foreground"}`}>{day}</span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((e) => (
                            <div
                              key={e.id}
                              className={`text-[9px] leading-tight px-1 py-0.5 rounded border truncate group relative cursor-default ${EVENT_COLORS[e.type] || EVENT_COLORS.Other}`}
                              title={`${e.title} (${e.type})`}
                            >
                              {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event list */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">All Events</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...eventStore.items].sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border p-3 group">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => eventStore.remove(e.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {eventStore.items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No events yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Event title" /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v as SchoolEvent["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEvent} disabled={!eventForm.title.trim() || !eventForm.date}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
