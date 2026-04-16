// Auth utilities for role-based access control

export type UserRole = "admin" | "teacher" | "parent";

export interface AuthState {
  loggedIn: boolean;
  role: UserRole;
  name: string;
  email: string;
  // For teacher: which teacher ID
  teacherId?: string;
  // For parent: which student IDs
  studentIds?: string[];
}

export const ROLE_CREDENTIALS: Record<UserRole, { email: string; password: string; name: string; teacherId?: string; studentIds?: string[] }> = {
  admin: { email: "admin@mpsms.edu.gh", password: "admin123", name: "Admin" },
  teacher: { email: "teacher@mpsms.edu.gh", password: "teacher123", name: "Mr. Kwadwo Asare", teacherId: "t1" },
  parent: { email: "parent@mpsms.edu.gh", password: "parent123", name: "Ibrahim Mensah", studentIds: ["s1"] },
};

export function getAuth(): AuthState | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("mpsms_auth") : null;
    if (!raw) return null;
    const auth = JSON.parse(raw) as AuthState;
    if (!auth.loggedIn) return null;
    return auth;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthState): void {
  localStorage.setItem("mpsms_auth", JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem("mpsms_auth");
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
  { to: "/timetable", label: "Timetable", roles: ["admin", "teacher"] },
  { to: "/notifications", label: "Notifications", roles: ["admin", "teacher", "parent"] },
  { to: "/calendar", label: "Calendar", roles: ["admin", "teacher", "parent"] },
  { to: "/library", label: "Library", roles: ["admin", "teacher"] },
  { to: "/communications", label: "Communications", roles: ["admin"] },
  { to: "/reports", label: "Reports", roles: ["admin"] },
  { to: "/ai-assistant", label: "AI Assistant", roles: ["admin", "teacher"] },
  { to: "/settings", label: "Settings", roles: ["admin"] },
];

// Activity log
export interface ActivityEntry {
  id: string;
  action: string;
  timestamp: string;
}

export function logActivity(action: string): void {
  try {
    const raw = localStorage.getItem("mpsms_activity") || "[]";
    const log: ActivityEntry[] = JSON.parse(raw);
    log.unshift({ id: Date.now().toString(36), action, timestamp: new Date().toISOString() });
    // Keep last 50
    localStorage.setItem("mpsms_activity", JSON.stringify(log.slice(0, 50)));
  } catch { /* ignore */ }
}

export function getActivity(): ActivityEntry[] {
  try {
    return JSON.parse(localStorage.getItem("mpsms_activity") || "[]");
  } catch {
    return [];
  }
}
