import { supabase } from "./supabaseClient";

// ===== Table mapping =====
const TABLE_MAP: Record<string, string> = {} as any; // populated after KEYS is defined

// ===== Generic storage utilities (Supabase-first, localStorage fallback) =====

export function getItems<T>(key: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  } catch {
    return defaults;
  }
}

// Active query deduplication cache
const activeQueries: Record<string, Promise<{ data: any[] | null; error: any }>> = {};

export function fetchTableDeduplicated(table: string): Promise<{ data: any[] | null; error: any }> {
  if (activeQueries[table]) {
    return activeQueries[table];
  }
  const promise = supabase.from(table).select("*").then((res) => {
    delete activeQueries[table];
    return res;
  }).catch((err) => {
    delete activeQueries[table];
    throw err;
  });
  activeQueries[table] = promise;
  return promise;
}

/** Async version: tries Supabase first, falls back to localStorage */
export async function getItemsAsync<T>(key: string, defaults: T[]): Promise<T[]> {
  const table = TABLE_MAP[key];
  if (table) {
    try {
      const { data, error } = await fetchTableDeduplicated(table);
      if (!error && data && data.length > 0) {
        // Cache in localStorage for offline access
        localStorage.setItem(key, JSON.stringify(data));
        return data as T[];
      }
    } catch {
      // Fall through to localStorage
    }
  }
  return getItems<T>(key, defaults);
}
export function setItems<T>(key: string, items: T[] | T, sync = true): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));

    // Background sync to Supabase if sync flag is enabled
    if (sync) {
      const table = TABLE_MAP[key];
      if (table) {
        const data = Array.isArray(items) ? items : [items];
        supabase.from(table).upsert(data).then(({ error }) => {
          if (error) console.error(`Sync error for ${table}:`, error);
        });
      }
    }
  } catch (err) {
    console.error("Storage error:", err);
  }
}
/** Async version: writes to Supabase first, then caches in localStorage */
export async function setItemsAsync<T>(key: string, items: T[] | T): Promise<void> {
  const table = TABLE_MAP[key];
  if (table) {
    try {
      const data = Array.isArray(items) ? items : [items];
      const { error } = await supabase.from(table).upsert(data);
      if (error) console.error(`Sync error for ${table}:`, error);
    } catch (err) {
      console.error(`Supabase write error for ${table}:`, err);
    }
  }
  // Always update localStorage as cache
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

/** Delete a single record from Supabase + localStorage */
export async function deleteItemAsync<T extends { id: string }>(
  key: string,
  id: string,
  defaults: T[]
): Promise<T[]> {
  const table = TABLE_MAP[key];
  if (table) {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) console.error(`Delete error for ${table}:`, error);
    } catch {}
  }
  const items = getItems<T>(key, defaults).filter((i) => i.id !== id);
  try { localStorage.setItem(key, JSON.stringify(items)); } catch {}
  return items;
}

export async function syncCloudToLocal(): Promise<void> {
  const lastSync = localStorage.getItem("mpsms_last_sync_time");
  if (lastSync && Date.now() - parseInt(lastSync) < 60000) {
    return;
  }

  // Save sync time immediately to block concurrent triggers
  localStorage.setItem("mpsms_last_sync_time", Date.now().toString());

  try {
    // Read user role directly from local metadata to filter sync scope
    const authRaw = localStorage.getItem("mpsms_auth_meta");
    const auth = authRaw ? JSON.parse(authRaw) : null;
    const role = auth?.role || "parent";

    // Build list of target keys to sync based on role
    let targetKeys = Object.keys(TABLE_MAP);
    if (role === "parent") {
      targetKeys = [KEYS.STUDENTS, KEYS.RESULTS, KEYS.PAYMENTS, KEYS.SETTINGS, KEYS.NOTIFICATIONS, KEYS.EVENTS];
    } else if (role === "teacher") {
      targetKeys = [
        KEYS.STUDENTS, KEYS.TEACHERS, KEYS.CLASSES, KEYS.SUBJECTS, KEYS.ATTENDANCE,
        KEYS.RESULTS, KEYS.TIMETABLE, KEYS.NOTIFICATIONS, KEYS.EVENTS, KEYS.BOOKS, KEYS.ISSUES, KEYS.SETTINGS
      ];
    }

    // Sequentially stagger database queries with 30ms intervals to keep assets pipeline clear
    for (let i = 0; i < targetKeys.length; i++) {
      const key = targetKeys[i];
      const table = TABLE_MAP[key];
      if (!table) continue;

      // Introduce 30ms stagger delay
      await new Promise((resolve) => setTimeout(resolve, 30));

      try {
        const { data, error } = await fetchTableDeduplicated(table);
        if (error) {
          console.warn(`Could not sync ${table}:`, error);
          continue;
        }
        if (data) {
          if (table === "settings") {
            localStorage.setItem(key, JSON.stringify(data[0] || defaultSettings));
          } else {
            localStorage.setItem(key, JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error(`Error syncing ${table}:`, err);
      }
    }
  } catch (err) {
    console.error("Master sync error:", err);
  }
}

export function addItem<T extends { id: string }>(key: string, item: T, defaults: T[]): T[] {
  const items = getItems<T>(key, defaults);
  items.push(item);
  setItems(key, items);
  return items;
}

export function updateItem<T extends { id: string }>(key: string, updated: T, defaults: T[]): T[] {
  const items = getItems<T>(key, defaults).map((i) => (i.id === updated.id ? updated : i));
  setItems(key, items);
  return items;
}

export function deleteItem<T extends { id: string }>(key: string, id: string, defaults: T[]): T[] {
  const items = getItems<T>(key, defaults).filter((i) => i.id !== id);
  setItems(key, items);
  return items;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Type Interfaces =====

export interface Student {
  id: string;
  name: string;
  class: string;
  gender: string;
  guardian: string;
  phone: string;
  dob: string;
  status: string;
  fees: string;
  address: string;
  photo?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  admissionDate?: string;
  religion?: string;
  nationality?: string;
  region?: string;
  amountPaid?: number;
  nhisNumber?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  classes: string;
  phone: string;
  email: string;
  qualification: string;
  status: string;
  dateOfJoining?: string;
  employeeId?: string;
  emergencyContact?: string;
  specialization?: string;
  accountNumber?: string;
  bankName?: string;
  bloodGroup?: string;
  user_id?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  teacher: string;
  capacity: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classes: string;
  status: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  date: string;
  status: "Present" | "Absent" | "Late";
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  term: string;
  subjects: {
    name: string;
    classScore: number;
    examScore: number;
    total: number;
    grade: string;
    remark: string;
  }[];
  totalScore: number;
  average: number;
  position?: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  reference?: string;
}

export interface FeeStructure {
  id: string;
  className: string;
  amount: number;
  description: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  totalFee: number;
  amountPaid: number;
  date: string;
  description: string;
}

export interface GradingScale {
  grade: string;
  minScore: number;
  remark: string;
}

export interface SchoolSettings {
  id: string;
  name: string;
  motto: string;
  location: string;
  phone: string;
  email: string;
  academicYear: string;
  currentTerm: string;
  termStart: string;
  termEnd: string;
  examWeight: number;
  classWorkWeight: number;
  logo?: string;
  address: string;
  // Professional additions
  gradingScales: GradingScale[];
  whatsappApiKey?: string;
  aiTone: "Professional" | "Warm" | "Strict";
  currency: string;
  receiptPrefix: string;
  momoNumber?: string;
  momoProvider?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  audience: "All" | "Teachers" | "Parents";
  date: string;
  read: boolean;
}

export interface TimetableSlot {
  id: string;
  day: string;
  period: string;
  subject: string;
  teacher: string;
  className: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  type: "Exam" | "Meeting" | "Event" | "Holiday" | "Other";
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  date: string;
  description: string;
  action: string;
  severity: "Low" | "Medium" | "High";
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: number;
  available: number;
  location: string;
}

export interface LibraryIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate: string;
  status: string;
}

export const CLASS_LIST = [
  "Creche", "Nursery 1", "Nursery 2", "KG 1", "KG 2",
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JHS 1", "JHS 2", "JHS 3",
];

// ===== Default Data =====

export const defaultStudents: Student[] = [];

export const defaultTeachers: Teacher[] = [];

export const defaultClasses: SchoolClass[] = [
  { id: "class_creche", name: "Creche", teacher: "Unassigned", capacity: 40 },
  { id: "class_nursery1", name: "Nursery 1", teacher: "Unassigned", capacity: 40 },
  { id: "class_nursery2", name: "Nursery 2", teacher: "Unassigned", capacity: 40 },
  { id: "class_kg1", name: "KG 1", teacher: "Unassigned", capacity: 40 },
  { id: "class_kg2", name: "KG 2", teacher: "Unassigned", capacity: 40 },
  { id: "class_primary1", name: "Primary 1", teacher: "Unassigned", capacity: 40 },
  { id: "class_primary2", name: "Primary 2", teacher: "Unassigned", capacity: 40 },
  { id: "class_primary3", name: "Primary 3", teacher: "Unassigned", capacity: 40 },
  { id: "class_primary4", name: "Primary 4", teacher: "Unassigned", capacity: 40 },
  { id: "class_primary5", name: "Primary 5", teacher: "Unassigned", capacity: 40 },
  { id: "class_primary6", name: "Primary 6", teacher: "Unassigned", capacity: 40 },
  { id: "class_jhs1", name: "JHS 1", teacher: "Unassigned", capacity: 40 },
  { id: "class_jhs2", name: "JHS 2", teacher: "Unassigned", capacity: 40 },
  { id: "class_jhs3", name: "JHS 3", teacher: "Unassigned", capacity: 40 },
];

export const defaultSubjects: Subject[] = [];

export const defaultPayments: Payment[] = [];

export const defaultSettings: SchoolSettings = {
  id: "school_settings_1",
  name: "Mujahideen Preparatory School",
  motto: "God Fearing and Better Future Starts Here",
  location: "Mankessim, Central Region, Ghana",
  phone: "",
  email: "",
  academicYear: "2025/2026",
  currentTerm: "Term 1",
  termStart: "",
  termEnd: "",
  examWeight: 50,
  classWorkWeight: 50,
  address: "P.O. Box 45, Mankessim - Central Region",
  aiTone: "Professional",
  whatsappApiKey: "",
  currency: "GHS",
  receiptPrefix: "MPS-",
  gradingScales: [
    { grade: "A1", minScore: 80, remark: "Excellent" },
    { grade: "B2", minScore: 70, remark: "Very Good" },
    { grade: "B3", minScore: 60, remark: "Good" },
    { grade: "C4", minScore: 55, remark: "Credit" },
    { grade: "C5", minScore: 50, remark: "Credit" },
    { grade: "C6", minScore: 45, remark: "Credit" },
    { grade: "D7", minScore: 40, remark: "Pass" },
    { grade: "E8", minScore: 35, remark: "Pass" },
    { grade: "F9", minScore: 0, remark: "Fail" },
  ],
};

// Storage keys
export const KEYS = {
  STUDENTS: "mpsms_students",
  TEACHERS: "mpsms_teachers",
  CLASSES: "mpsms_classes",
  SUBJECTS: "mpsms_subjects",
  ATTENDANCE: "mpsms_attendance",
  RESULTS: "mpsms_results",
  PAYMENTS: "mpsms_payments",
  SETTINGS: "mpsms_settings",
  AUTH: "mpsms_auth",
  NOTIFICATIONS: "mpsms_notifications",
  TIMETABLE: "mpsms_timetable",
  EVENTS: "mpsms_events",
  DISCIPLINE: "mpsms_discipline",
  EXPENSES: "mpsms_expenses",
  BOOKS: "mpsms_library_books",
  ISSUES: "mpsms_library_issues",
  FEE_STRUCTURE: "mpsms_fee_structure",
  COMMUNICATIONS: "mpsms_communications",
};

// Populate TABLE_MAP after KEYS is defined
Object.assign(TABLE_MAP, {
  [KEYS.STUDENTS]: "students",
  [KEYS.TEACHERS]: "teachers",
  [KEYS.CLASSES]: "classes",
  [KEYS.SUBJECTS]: "subjects",
  [KEYS.RESULTS]: "results",
  [KEYS.PAYMENTS]: "payments",
  [KEYS.EXPENSES]: "expenses",
  [KEYS.ATTENDANCE]: "attendance",
  [KEYS.EVENTS]: "events",
  [KEYS.SETTINGS]: "settings",
  [KEYS.TIMETABLE]: "timetable",
  [KEYS.NOTIFICATIONS]: "notifications",
  [KEYS.DISCIPLINE]: "discipline",
  [KEYS.BOOKS]: "library_books",
  [KEYS.ISSUES]: "library_issues",
  [KEYS.FEE_STRUCTURE]: "fee_structure",
  [KEYS.COMMUNICATIONS]: "communications",
});

export const defaultFeeStructure: FeeStructure[] = [];

export const defaultEvents: SchoolEvent[] = [];

// Backup & Restore utilities
export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  Object.values(KEYS).forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) data[key] = JSON.parse(raw);
  });
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return true;
  } catch {
    return false;
  }
}

/** Get the Supabase table name for a given storage key */
export function getTableName(key: string): string | undefined {
  return TABLE_MAP[key];
}

/** Update a student's fee status dynamically based on their transaction history */
export async function updateStudentFeeStatus(studentId: string): Promise<string> {
  try {
    // Fetch all payments for this student
    const { data: payments, error } = await supabase
      .from("payments")
      .select("totalFee, amountPaid")
      .eq("studentId", studentId);
      
    if (error) throw error;
    
    let totalFee = 0;
    let amountPaid = 0;
    if (payments) {
      payments.forEach((p) => {
        totalFee += Number(p.totalFee || 0);
        amountPaid += Number(p.amountPaid || 0);
      });
    }
    
    let status = "Unpaid";
    if (amountPaid >= totalFee && totalFee > 0) {
      status = "Paid";
    } else if (amountPaid > 0) {
      status = "Partial";
    }
    
    // Update student in database
    await supabase
      .from("students")
      .update({ fees: status })
      .eq("id", studentId);
      
    // Update student in local storage cache
    const students = getItems<Student>(KEYS.STUDENTS, []);
    const updated = students.map((s) => (s.id === studentId ? { ...s, fees: status } : s));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
    
    return status;
  } catch (err) {
    console.error("Error updating student fee status:", err);
    return "Unpaid";
  }
}

