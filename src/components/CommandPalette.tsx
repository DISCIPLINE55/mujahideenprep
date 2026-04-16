import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Users, GraduationCap, School, BookOpen, ClipboardCheck, FileText, Wallet, Settings, CalendarDays, Sparkles, BarChart3, Bell, MessageSquare, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { getItems, defaultStudents, defaultTeachers, KEYS, type Student, type Teacher } from "@/lib/storage";
import { getAuth, ROLE_NAV } from "@/lib/auth";

const ICON_MAP: Record<string, React.ElementType> = {
  Dashboard: School,
  Students: Users,
  Teachers: GraduationCap,
  Classes: School,
  Subjects: BookOpen,
  Attendance: ClipboardCheck,
  Results: FileText,
  Fees: Wallet,
  Timetable: CalendarDays,
  Notifications: Bell,
  Calendar: CalendarDays,
  Library: Library,
  Communications: MessageSquare,
  Reports: BarChart3,
  "AI Assistant": Sparkles,
  Settings: Settings,
};

interface SearchResult {
  type: "page" | "student" | "teacher";
  label: string;
  sublabel?: string;
  to: string;
  icon: React.ElementType;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    const items: SearchResult[] = [];

    // Pages
    const pages = ROLE_NAV.filter((n) => auth && n.roles.includes(auth.role));
    pages.forEach((p) => {
      if (!q || p.label.toLowerCase().includes(q)) {
        items.push({ type: "page", label: p.label, to: p.to, icon: ICON_MAP[p.label] || School });
      }
    });

    // Students
    if (!auth || auth.role === "admin") {
      const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
      students.forEach((s) => {
        if (!q || s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q)) {
          items.push({ type: "student", label: s.name, sublabel: s.class, to: `/students/${s.id}`, icon: Users });
        }
      });
    }

    // Teachers
    if (!auth || auth.role === "admin") {
      const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);
      teachers.forEach((t) => {
        if (!q || t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)) {
          items.push({ type: "teacher", label: t.name, sublabel: t.subject, to: `/teachers/${t.id}`, icon: GraduationCap });
        }
      });
    }

    return items.slice(0, 15);
  }, [query, auth]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate({ to: result.to as any });
  }, [navigate]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
    if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-lg overflow-hidden gap-0">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, students, teachers..."
            className="h-11 border-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.type}-${r.to}-${i}`}
                onClick={() => handleSelect(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                  i === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
                )}
              >
                <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.label}</p>
                  {r.sublabel && <p className="text-xs text-muted-foreground truncate">{r.sublabel}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase shrink-0">{r.type}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
