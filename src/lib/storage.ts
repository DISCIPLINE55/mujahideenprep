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
const activeQueries: Record<string, Promise<{ data: any[] | null; error: any }> | undefined> = {};

export function fetchTableDeduplicated(table: string): Promise<{ data: any[] | null; error: any }> {
  if (activeQueries[table]) {
    return activeQueries[table]!;
  }
  const promise = Promise.resolve(supabase.from(table).select("*"))
    .then((res) => {
      delete activeQueries[table];
      return res;
    })
    .catch((err: any) => {
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

    if (sync) {
      const table = TABLE_MAP[key];
      if (table) {
        const data = Array.isArray(items) ? items : [items];
        data.forEach(item => {
          queueSyncAction(table, key, "upsert", (item as any).id, item);
        });
        processSyncOutbox();
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
    const data = Array.isArray(items) ? items : [items];
    data.forEach(item => {
      queueSyncAction(table, key, "upsert", (item as any).id, item);
    });
    await processSyncOutbox();
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
    queueSyncAction(table, key, "delete", id);
    processSyncOutbox();
  }
  const items = getItems<T>(key, defaults).filter((i) => i.id !== id);
  try { localStorage.setItem(key, JSON.stringify(items)); } catch {}
  return items;
}

export async function syncCloudToLocal(): Promise<void> {
  const lastSync = localStorage.getItem("mpsms_last_sync_time");
  if (lastSync && Date.now() - parseInt(lastSync) < 300000) {
    return;
  }

  // Save sync time immediately to block concurrent triggers
  localStorage.setItem("mpsms_last_sync_time", Date.now().toString());

  // Run pending outbox sync first
  await processSyncOutbox();

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
        KEYS.RESULTS, KEYS.TIMETABLE, KEYS.NOTIFICATIONS, KEYS.EVENTS, KEYS.BOOKS, KEYS.ISSUES, KEYS.SETTINGS,
        KEYS.EXAMS
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
        let query = supabase.from(table).select("*");
        // Enforce teacher isolation for exams at the API level
        if (key === KEYS.EXAMS && role === "teacher") {
          query = query.eq("created_by", auth.name);
        }
        
        const { data, error } = await query;
        if (error) {
          console.warn(`Could not sync ${table}:`, error);
          continue;
        }
        if (data) {
          if (table === "settings") {
            const merged = mergeServerRecords(key, data);
            localStorage.setItem(key, JSON.stringify([merged[0] || defaultSettings]));
          } else {
            const merged = mergeServerRecords(key, data);
            localStorage.setItem(key, JSON.stringify(merged));
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
  dob?: string | null;
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

export interface ExamPaper {
  id: string;
  title: string;
  academic_year: string;
  academic_term: string;
  class_name: string;
  subject: string;
  exam_type: string;
  duration: string;
  instructions: string;
  content: string;
  created_by: string;
  status: string; // 'draft', 'reviewed', 'approved', 'archived'
  created_at?: string;
  updated_at?: string;
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
  EXAMS: "mpsms_exams",
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
  [KEYS.EXAMS]: "exams",
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
    
    let maxTotalFee = 0;
    let amountPaid = 0;
    if (payments) {
      payments.forEach((p) => {
        const pFee = Number(p.totalFee || 0);
        if (pFee > maxTotalFee) {
          maxTotalFee = pFee;
        }
        amountPaid += Number(p.amountPaid || 0);
      });
    }
    const totalFee = maxTotalFee;
    
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

// ===== Outbox Sync Engine =====

export interface SyncAction {
  id: string;
  table: string;
  key: string;
  action: "upsert" | "delete";
  recordId: string;
  record?: any;
  timestamp: number;
}

export function getSyncOutbox(): SyncAction[] {
  try {
    const raw = localStorage.getItem("mpsms_sync_outbox");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSyncOutbox(outbox: SyncAction[]): void {
  try {
    localStorage.setItem("mpsms_sync_outbox", JSON.stringify(outbox));
  } catch (err) {
    console.error("Failed to save sync outbox:", err);
  }
}

export function queueSyncAction(table: string, key: string, action: "upsert" | "delete", recordId: string, record?: any): void {
  const outbox = getSyncOutbox();
  const existingIndex = outbox.findIndex(a => a.table === table && a.recordId === recordId);
  const newAction: SyncAction = {
    id: Math.random().toString(36).substring(2, 9),
    table,
    key,
    action,
    recordId,
    record,
    timestamp: Date.now()
  };
  
  if (existingIndex >= 0) {
    outbox[existingIndex] = newAction;
  } else {
    outbox.push(newAction);
  }
  saveSyncOutbox(outbox);
}

let isProcessingOutbox = false;

export async function processSyncOutbox(): Promise<void> {
  if (isProcessingOutbox) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  
  const outbox = getSyncOutbox();
  if (outbox.length === 0) return;
  
  isProcessingOutbox = true;
  console.log(`[Sync Engine] Processing outbox with ${outbox.length} pending actions...`);
  
  const actionsToProcess = [...outbox];
  
  for (const action of actionsToProcess) {
    try {
      if (action.action === "upsert") {
        const recordToPush = {
          ...action.record,
          updated_at: new Date().toISOString(),
          is_deleted: false
        };
        const { error } = await supabase.from(action.table).upsert(recordToPush);
        if (error) throw error;
      } else if (action.action === "delete") {
        const { error } = await supabase
          .from(action.table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq("id", action.recordId);
        if (error) throw error;
      }
      
      const currentOutbox = getSyncOutbox().filter(a => a.id !== action.id);
      saveSyncOutbox(currentOutbox);
    } catch (err) {
      console.error(`[Sync Engine] Action ${action.id} failed for table ${action.table}:`, err);
      break;
    }
  }
  
  isProcessingOutbox = false;
}

export function mergeServerRecords<T extends { id: string, updated_at?: string }>(key: string, serverRecords: T[]): T[] {
  const localItems = getItems<T>(key, []);
  const outbox = getSyncOutbox();
  const table = TABLE_MAP[key];
  
  const pendingIds = new Set(
    outbox.filter(a => a.table === table).map(a => a.recordId)
  );
  
  const mergedMap = new Map<string, T>();
  
  localItems.forEach(item => {
    mergedMap.set(item.id, item);
  });
  
  serverRecords.forEach(serverRec => {
    if (pendingIds.has(serverRec.id)) {
      return;
    }
    
    if ((serverRec as any).is_deleted === true) {
      mergedMap.delete(serverRec.id);
      return;
    }
    
    const localRec = mergedMap.get(serverRec.id);
    if (!localRec) {
      mergedMap.set(serverRec.id, serverRec);
    } else {
      const localTime = localRec.updated_at ? new Date(localRec.updated_at).getTime() : 0;
      const serverTime = serverRec.updated_at ? new Date(serverRec.updated_at).getTime() : 0;
      
      if (serverTime >= localTime) {
        mergedMap.set(serverRec.id, serverRec);
      }
    }
  });
  
  const serverIds = new Set(serverRecords.map(r => r.id));
  mergedMap.forEach((rec, id) => {
    if (!serverIds.has(id) && !pendingIds.has(id)) {
      mergedMap.delete(id);
    }
  });
  
  return Array.from(mergedMap.values());
}

