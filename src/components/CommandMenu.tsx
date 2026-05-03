import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Users, 
  GraduationCap, 
  Settings, 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  ClipboardCheck, 
  Wallet,
  Search
} from "lucide-react";
import { getItems, KEYS, defaultStudents, defaultTeachers, type Student, type Teacher } from "@/lib/storage";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);
  const teachers = getItems<Teacher>(KEYS.TEACHERS, defaultTeachers);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md hover:bg-accent transition-colors w-full max-w-[200px]"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard" }))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/students" }))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Students</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/teachers" }))}>
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>Teachers</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Students">
            {students.slice(0, 5).map((s) => (
              <CommandItem
                key={s.id}
                onSelect={() => runCommand(() => navigate({ to: "/students/$studentId", params: { studentId: s.id } }))}
              >
                <div className="flex items-center gap-2">
                   {s.photo ? (
                    <img src={s.photo} alt="" className="h-4 w-4 rounded-full object-cover" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  <span>{s.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{s.class}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Teachers">
            {teachers.slice(0, 5).map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => runCommand(() => navigate({ to: "/teachers/$teacherId", params: { teacherId: t.id } }))}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                <span>{t.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{t.subject}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/attendance" }))}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              <span>Attendance</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/fees" }))}>
              <Wallet className="mr-2 h-4 w-4" />
              <span>Fees & Finance</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/timetable" }))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Timetable</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/settings" }))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
