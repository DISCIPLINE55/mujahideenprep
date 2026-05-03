import { supabase } from "./supabaseClient";

export type UserRole = "admin" | "teacher" | "parent";

export interface AuthState {
  loggedIn: boolean;
  role: UserRole;
  name: string;
  email: string;
  teacherId?: string;
  studentIds?: string[];
}

export async function getAuth(): Promise<AuthState | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mpsms_auth_meta");
    }
    return null;
  }

  // Fetch role from user_roles (source of truth); fall back to metadata
  let role: UserRole = (session.user.user_metadata.role as UserRole) || "parent";
  try {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    if (roles && roles.length > 0) {
      // Prefer admin > teacher > parent if multiple
      const order: UserRole[] = ["admin", "teacher", "parent"];
      const found = order.find((r) => roles.some((x: any) => x.role === r));
      if (found) role = found;
    }
  } catch { /* ignore, use metadata fallback */ }

  // Optional: load linked students for parents
  let studentIds: string[] | undefined;
  if (role === "parent") {
    const { data: links } = await supabase
      .from("parent_students")
      .select("student_id")
      .eq("parent_user_id", session.user.id);
    studentIds = links?.map((l: any) => l.student_id);
  }

  const auth: AuthState = {
    loggedIn: true,
    role,
    name: session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "User",
    email: session.user.email || "",
    teacherId: session.user.user_metadata.teacherId,
    studentIds: studentIds ?? session.user.user_metadata.studentIds,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("mpsms_auth_meta", JSON.stringify(auth));
  }
  return auth;
}

export function getAuthSync(): AuthState | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("mpsms_auth_meta") : null;
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthState): void {
  // Supabase handles session persistence automatically, but we can store extra metadata if needed
  if (typeof window !== "undefined") {
    localStorage.setItem("mpsms_auth_meta", JSON.stringify(auth));
  }
}

export async function signOut() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    localStorage.removeItem("mpsms_auth_meta");
    window.location.href = "/";
  }
}

// Sidebar items visible per role
export type NavItem = {
  to: string;
  label: string;
  icon: string; // icon name key
  roles: UserRole[];
};

export const ROLE_NAV: { to: string; label: string; roles: UserRole[] }[] = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin"] },
  { to: "/teacher-dashboard", label: "Dashboard", roles: ["teacher"] },
  { to: "/parent-dashboard", label: "Dashboard", roles: ["parent"] },
  { to: "/students", label: "Students", roles: ["admin"] },
  { to: "/teachers", label: "Teachers", roles: ["admin"] },
  { to: "/classes", label: "Classes", roles: ["admin"] },
  { to: "/subjects", label: "Subjects", roles: ["admin"] },
  { to: "/attendance", label: "Attendance", roles: ["admin", "teacher"] },
  { to: "/results", label: "Results", roles: ["admin", "teacher", "parent"] },
  { to: "/fees", label: "Fees", roles: ["admin", "parent"] },
  { to: "/expenses", label: "Expenses", roles: ["admin"] },
  { to: "/timetable", label: "Timetable", roles: ["admin", "teacher"] },
  { to: "/notifications", label: "Notifications", roles: ["admin", "teacher", "parent"] },
  { to: "/calendar", label: "Calendar", roles: ["admin", "teacher", "parent"] },
  { to: "/library", label: "Library", roles: ["admin", "teacher"] },
  { to: "/communications", label: "Communications", roles: ["admin"] },
  { to: "/reports", label: "Reports", roles: ["admin"] },
  { to: "/ai-assistant", label: "AI Assistant", roles: ["admin", "teacher"] },
  { to: "/settings", label: "Settings", roles: ["admin", "teacher", "parent"] },
];

// Activity log
export interface ActivityEntry {
  id: string;
  action: string;
  timestamp: string;
}

export function logActivity(action: string): void {
  try {
    const auth = getAuthSync();
    const raw = localStorage.getItem("mpsms_activity") || "[]";
    const log: ActivityEntry[] = JSON.parse(raw);
    const entry = { id: Date.now().toString(36), action, timestamp: new Date().toISOString() };
    log.unshift(entry);
    localStorage.setItem("mpsms_activity", JSON.stringify(log.slice(0, 50)));

    // Background sync to Supabase
    supabase.from("activity_logs").insert({
      id: entry.id,
      action: entry.action,
      user_name: auth?.name || "System",
      user_role: auth?.role || "Guest",
      timestamp: entry.timestamp
    }).then(({ error }) => { if (error) console.error("Log sync error:", error); });
  } catch { /* ignore */ }
}

export async function getActivity(): Promise<ActivityEntry[]> {
  try {
    const { data, error } = await supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }).limit(50);
    if (error) throw error;
    return data as ActivityEntry[];
  } catch {
    return JSON.parse(localStorage.getItem("mpsms_activity") || "[]");
  }
}
