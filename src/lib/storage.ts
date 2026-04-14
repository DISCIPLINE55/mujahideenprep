// Generic localStorage CRUD utilities

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

export function setItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
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

// ===== Default Data =====

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
  subjects: { name: string; score: number }[];
  total: number;
  average: number;
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

export interface SchoolSettings {
  name: string;
  motto: string;
  location: string;
  phone: string;
  email: string;
  academicYear: string;
  currentTerm: string;
  termStart: string;
  termEnd: string;
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

export const CLASS_LIST = [
  "Creche", "Nursery 1", "Nursery 2", "KG 1", "KG 2",
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JHS 1", "JHS 2", "JHS 3",
];

export const defaultStudents: Student[] = [
  { id: "s1", name: "Amina Ibrahim", class: "JHS 3", gender: "Female", guardian: "Ibrahim Mensah", phone: "024-555-0201", dob: "2011-03-15", status: "Active", fees: "Paid", address: "Mankessim" },
  { id: "s2", name: "Kwame Mensah", class: "Primary 6", gender: "Male", guardian: "Ama Mensah", phone: "024-555-0202", dob: "2013-07-22", status: "Active", fees: "Partial", address: "Saltpond" },
  { id: "s3", name: "Fatima Agyei", class: "KG 2", gender: "Female", guardian: "Kofi Agyei", phone: "024-555-0203", dob: "2018-01-10", status: "Active", fees: "Paid", address: "Mankessim" },
  { id: "s4", name: "Yusuf Osei", class: "JHS 1", gender: "Male", guardian: "Osei Bonsu", phone: "024-555-0204", dob: "2012-11-05", status: "Active", fees: "Unpaid", address: "Cape Coast" },
  { id: "s5", name: "Zainab Boateng", class: "Nursery 2", gender: "Female", guardian: "Ama Boateng", phone: "024-555-0205", dob: "2020-06-18", status: "Active", fees: "Paid", address: "Mankessim" },
  { id: "s6", name: "Abdul-Rahman Tetteh", class: "Primary 3", gender: "Male", guardian: "Tetteh Quarshie", phone: "024-555-0206", dob: "2015-09-30", status: "Active", fees: "Paid", address: "Anomabu" },
  { id: "s7", name: "Halimatu Adjei", class: "JHS 2", gender: "Female", guardian: "Adjei Mensah", phone: "024-555-0207", dob: "2011-12-25", status: "Inactive", fees: "Unpaid", address: "Mankessim" },
  { id: "s8", name: "Mohammed Asante", class: "Primary 1", gender: "Male", guardian: "Asante Kofi", phone: "024-555-0208", dob: "2017-04-14", status: "Active", fees: "Partial", address: "Saltpond" },
];

export const defaultTeachers: Teacher[] = [
  { id: "t1", name: "Mr. Kwadwo Asare", subject: "Mathematics", classes: "JHS 1-3", phone: "024-555-0101", email: "k.asare@mpsms.edu.gh", qualification: "B.Ed Mathematics", status: "Active" },
  { id: "t2", name: "Mrs. Akosua Darko", subject: "English Language", classes: "Primary 4-6", phone: "024-555-0102", email: "a.darko@mpsms.edu.gh", qualification: "B.Ed English", status: "Active" },
  { id: "t3", name: "Mr. Ibrahim Tanko", subject: "Arabic/Islamic Studies", classes: "All Classes", phone: "024-555-0103", email: "i.tanko@mpsms.edu.gh", qualification: "B.A Arabic Studies", status: "Active" },
  { id: "t4", name: "Miss. Esi Kumah", subject: "Science", classes: "JHS 1-3", phone: "024-555-0104", email: "e.kumah@mpsms.edu.gh", qualification: "B.Sc Biology", status: "Active" },
  { id: "t5", name: "Mr. Yaw Boakye", subject: "Social Studies", classes: "Primary 4-6", phone: "024-555-0105", email: "y.boakye@mpsms.edu.gh", qualification: "B.Ed Social Studies", status: "On Leave" },
  { id: "t6", name: "Mrs. Mariam Alhassan", subject: "Creche & Nursery", classes: "Creche, Nursery 1-2", phone: "024-555-0106", email: "m.alhassan@mpsms.edu.gh", qualification: "Diploma Early Childhood", status: "Active" },
];

export const defaultClasses: SchoolClass[] = CLASS_LIST.map((name, i) => ({
  id: `c${i + 1}`,
  name,
  teacher: defaultTeachers[i % defaultTeachers.length]?.name ?? "Unassigned",
  capacity: name.startsWith("JHS") ? 50 : name.startsWith("Primary") ? 40 : 30,
}));

export const defaultSubjects: Subject[] = [
  { id: "sub1", name: "Mathematics", code: "MATH", classes: "Primary 1 – JHS 3", status: "Active" },
  { id: "sub2", name: "English Language", code: "ENG", classes: "Primary 1 – JHS 3", status: "Active" },
  { id: "sub3", name: "Science", code: "SCI", classes: "Primary 4 – JHS 3", status: "Active" },
  { id: "sub4", name: "Social Studies", code: "SOC", classes: "Primary 4 – JHS 3", status: "Active" },
  { id: "sub5", name: "Arabic/Islamic Studies", code: "AIS", classes: "All Classes", status: "Active" },
  { id: "sub6", name: "French", code: "FRN", classes: "JHS 1 – JHS 3", status: "Active" },
  { id: "sub7", name: "ICT", code: "ICT", classes: "Primary 4 – JHS 3", status: "Active" },
  { id: "sub8", name: "Creative Arts", code: "CRA", classes: "Primary 1 – Primary 6", status: "Active" },
];

export const defaultPayments: Payment[] = [
  { id: "p1", studentId: "s1", studentName: "Amina Ibrahim", class: "JHS 3", totalFee: 850, amountPaid: 850, date: "2026-01-15", description: "Full tuition Term 2" },
  { id: "p2", studentId: "s2", studentName: "Kwame Mensah", class: "Primary 6", totalFee: 650, amountPaid: 400, date: "2026-02-10", description: "Partial tuition Term 2" },
  { id: "p3", studentId: "s3", studentName: "Fatima Agyei", class: "KG 2", totalFee: 500, amountPaid: 500, date: "2026-01-20", description: "Full tuition Term 2" },
  { id: "p4", studentId: "s4", studentName: "Yusuf Osei", class: "JHS 1", totalFee: 800, amountPaid: 0, date: "", description: "" },
  { id: "p5", studentId: "s5", studentName: "Zainab Boateng", class: "Nursery 2", totalFee: 450, amountPaid: 450, date: "2026-01-18", description: "Full tuition Term 2" },
];

export const defaultSettings: SchoolSettings = {
  name: "Mujahideen Preparatory School",
  motto: "God Fearing and Better Future Starts Here",
  location: "Mankessim, Central Region, Ghana",
  phone: "+233 24 555 0100",
  email: "info@mujahideenprep.edu.gh",
  academicYear: "2025/2026",
  currentTerm: "Term 2",
  termStart: "2026-01-06",
  termEnd: "2026-04-30",
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
};
