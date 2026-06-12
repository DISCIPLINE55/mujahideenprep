import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { getAuthSync } from "@/lib/auth";
import { KEYS, CLASS_LIST, defaultTeachers, defaultClasses, type Teacher, type SchoolClass } from "@/lib/storage";

export function useAllowedClasses() {
  const auth = getAuthSync();
  const isTeacher = auth?.role === "teacher";
  const isAdmin = auth?.role === "admin";

  const teacherStore = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const classStore = useStore<SchoolClass>(KEYS.CLASSES, defaultClasses);

  const allowedClasses = useMemo(() => {
    // Admins see all classes. Parents generally shouldn't see these global dropdowns anyway,
    // but if they do, fallback to CLASS_LIST or an empty array depending on preference.
    if (isAdmin || !isTeacher) {
      return CLASS_LIST;
    }

    const me = teacherStore.items.find((t) => 
      t.id === auth?.teacherId ||
      (auth?.userId && t.user_id === auth.userId) ||
      (auth?.email && t.email?.toLowerCase() === auth.email.toLowerCase())
    );

    if (!me) return [];

    // 1. Get class names from teacher profile classes (comma-separated string, e.g. "Creche")
    const profileClasses = me.classes 
      ? me.classes.split(",").map(s => s.trim()).filter(Boolean) 
      : [];

    // 2. Get class names from the classes table where me is class teacher
    const tableClasses = classStore.items
      .filter((c) => c.teacher === me.name)
      .map((c) => c.name);

    // Combine and deduplicate
    return Array.from(new Set([...profileClasses, ...tableClasses]));
  }, [auth, teacherStore.items, classStore.items, isTeacher, isAdmin]);

  return allowedClasses;
}
