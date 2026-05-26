import type { Notification, Teacher, SchoolClass, Student } from "./storage";
import type { AuthState } from "./auth";

// List of all classes from storage for parsing
const SCHOOL_CLASSES = [
  "Creche", "Nursery 1", "Nursery 2", "KG 1", "KG 2", 
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", 
  "JHS 1", "JHS 2", "JHS 3"
];

/**
 * Filter notifications based on role-based access control (RBAC) rules.
 * Teachers are locked out of finance, HR, system debugging, other teachers' data, other classes' student behavior/attendance, etc.
 * Parents are locked out of staff roster, other students' records, other parents' fees, etc.
 */
export function filterNotifications(
  notifications: Notification[],
  auth: AuthState | null,
  teachers: Teacher[] = [],
  classes: SchoolClass[] = [],
  students: Student[] = []
): Notification[] {
  if (!auth) return [];
  const role = auth.role?.toLowerCase();
  
  if (role === "admin") {
    return notifications;
  }

  return notifications.filter((n) => {
    const titleLower = (n.title || "").toLowerCase();
    const msgLower = (n.message || "").toLowerCase();
    const audience = (n.audience || "").toLowerCase();

    // 1. Audience Gating
    if (audience !== "all") {
      if (role === "teacher" && audience !== "teachers") return false;
      if (role === "parent" && audience !== "parents") return false;
    }

    // 2. Developer/Backend System filter (neither teachers nor parents should see developer errors/logs)
    const backendKeywords = [
      "deployment", "database error", "api gateway", "error log", "system config", 
      "postgres", "backend", "connection limit", "rls policy", "developer", "debug"
    ];
    if (backendKeywords.some(kw => titleLower.includes(kw) || msgLower.includes(kw))) {
      return false;
    }

    if (role === "teacher") {
      // Find teacher details to identify assigned classes
      const teacherObj = teachers.find(t => 
        t.id === auth.teacherId ||
        (auth.userId && t.user_id === auth.userId) ||
        (auth.email && t.email?.toLowerCase() === auth.email.toLowerCase())
      );
      const teacherName = teacherObj?.name;
      
      const assignedClasses = new Set<string>();
      if (teacherObj) {
        if (teacherObj.classes) {
          teacherObj.classes.split(",").map(c => c.trim()).forEach(c => assignedClasses.add(c));
        }
        classes.forEach(cls => {
          if (cls.teacher && teacherName && cls.teacher.toLowerCase() === teacherName.toLowerCase()) {
            assignedClasses.add(cls.name);
          }
        });
      }

      // --- Blocklist checks for Teachers ---

      // a. Financial/Fees notifications are strictly blocked
      const financeKeywords = [
        "fee", "payment", "outstanding", "balance", "momo", "financial", 
        "paid", "wallet", "revenue", "invoice", "receipt", "cost", "price", 
        "salary", "wages", "remuneration", "payroll"
      ];
      if (financeKeywords.some(kw => titleLower.includes(kw) || msgLower.includes(kw))) {
        return false;
      }

      // b. Other Teachers' Personal/HR Info is blocked (salary, leave, performance reviews)
      const hrKeywords = [
        "performance review", "leave approval", "salary details", "disciplinary action",
        "staff recruitment", "internal investigation", "HR memo", "confidential memo",
        "management strategy", "strategic plan", "conflict resolution", "leadership meeting"
      ];
      if (hrKeywords.some(kw => titleLower.includes(kw) || msgLower.includes(kw))) {
        return false;
      }

      // c. Other Classes' Student Data (reduces gossip, protects privacy)
      // Check if the notification mentions any specific class level.
      // If it mentions a class that the teacher is NOT assigned to, hide it.
      for (const clsName of SCHOOL_CLASSES) {
        const clsLower = clsName.toLowerCase();
        // Look for class names as whole words or specific formats
        const regex = new RegExp(`\\b${clsLower}\\b`, "i");
        if (regex.test(titleLower) || regex.test(msgLower)) {
          if (!assignedClasses.has(clsName)) {
            return false;
          }
        }
      }

      // d. Parent complaints or Parent-to-Admin confidential messages (should not be seen by teachers)
      const complaintKeywords = [
        "complaint about", "sensitive family", "financial hardship", "fee negotiation",
        "negotiated fee", "hardship discount", "negotiated payment"
      ];
      if (complaintKeywords.some(kw => titleLower.includes(kw) || msgLower.includes(kw))) {
        return false;
      }

      return true;
    }

    if (role === "parent") {
      // Find parent's children
      const myKids = students.filter(s => auth.studentIds?.includes(s.id));
      const kidNames = myKids.map(k => k.name.toLowerCase());
      const kidClasses = myKids.map(k => k.class);

      // --- Blocklist / Gating checks for Parents ---

      // a. Financial/Fees notifications: Parents must ONLY see financial notifications that contain their children's names
      const financeKeywords = [
        "fee", "payment", "outstanding", "balance", "momo", "paid", "receipt", "invoice"
      ];
      const hasFinanceKeyword = financeKeywords.some(kw => titleLower.includes(kw) || msgLower.includes(kw));
      if (hasFinanceKeyword) {
        const mentionsMyKid = kidNames.some(name => titleLower.includes(name) || msgLower.includes(name));
        if (!mentionsMyKid) {
          return false;
        }
      }

      // b. Student-specific behavior/grades announcements:
      // If it contains behavior notes or results/grades, hide it unless it mentions one of their children
      const sensitiveStudentKeywords = [
        "behaviour", "misconduct", "disciplinary", "exam result", "grades", "report card",
        "grade", "academic report", "report sheet", "marks", "score", "attendance"
      ];
      const hasSensitiveKeyword = sensitiveStudentKeywords.some(kw => titleLower.includes(kw) || msgLower.includes(kw));
      if (hasSensitiveKeyword) {
        const mentionsMyKid = kidNames.some(name => titleLower.includes(name) || msgLower.includes(name));
        if (!mentionsMyKid) {
          // Check if it's a general class announcement that they are allowed to see
          let classMentioned = false;
          let myClassMentioned = false;
          for (const clsName of SCHOOL_CLASSES) {
            const regex = new RegExp(`\\b${clsName.toLowerCase()}\\b`, "i");
            if (regex.test(titleLower) || regex.test(msgLower)) {
              classMentioned = true;
              if (kidClasses.includes(clsName)) {
                myClassMentioned = true;
              }
            }
          }
          if (classMentioned && !myClassMentioned) {
            return false;
          }
          if (!classMentioned) {
            return false;
          }
        }
      }

      // c. Staff Duty / Substitution / HR notices:
      const staffKeywords = [
        "staff meeting", "duty roster", "relief teaching", "substitution request",
        "supervision period", "teacher attendance"
      ];
      if (staffKeywords.some(kw => titleLower.includes(kw) || msgLower.includes(kw))) {
        return false;
      }

      return true;
    }

    return false;
  });
}
