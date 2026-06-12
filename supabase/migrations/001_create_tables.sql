-- ============================================================
-- MPSMS Database Schema — Mujahideen Preparatory School
-- ============================================================

-- 1. Students
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'Male',
  guardian TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  dob TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  fees TEXT DEFAULT 'Unpaid',
  address TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  "bloodGroup" TEXT DEFAULT '',
  "emergencyContactName" TEXT DEFAULT '',
  "emergencyContactPhone" TEXT DEFAULT '',
  "medicalConditions" TEXT DEFAULT '',
  "admissionDate" TEXT DEFAULT '',
  religion TEXT DEFAULT '',
  nationality TEXT DEFAULT '',
  region TEXT DEFAULT '',
  "amountPaid" NUMERIC DEFAULT 0,
  "nhisNumber" TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT DEFAULT '',
  classes TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  qualification TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  "dateOfJoining" TEXT DEFAULT '',
  "employeeId" TEXT DEFAULT '',
  "emergencyContact" TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  "accountNumber" TEXT DEFAULT '',
  "bankName" TEXT DEFAULT '',
  "bloodGroup" TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Classes
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher TEXT DEFAULT 'Unassigned',
  capacity INTEGER DEFAULT 40
);

-- 4. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT DEFAULT '',
  classes TEXT DEFAULT '',
  status TEXT DEFAULT 'Active'
);

-- 5. Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  class TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Present'
);

-- 6. Results (exam results with JSONB subjects array)
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  class TEXT NOT NULL,
  term TEXT NOT NULL,
  subjects JSONB NOT NULL DEFAULT '[]',
  "totalScore" NUMERIC DEFAULT 0,
  average NUMERIC DEFAULT 0,
  position INTEGER DEFAULT 0
);

-- 7. Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  class TEXT NOT NULL,
  "totalFee" NUMERIC DEFAULT 0,
  "amountPaid" NUMERIC DEFAULT 0,
  date TEXT DEFAULT '',
  description TEXT DEFAULT ''
);

-- 8. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '',
  amount NUMERIC DEFAULT 0,
  date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  reference TEXT DEFAULT ''
);

-- 9. Settings (singleton row)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'school_settings_1',
  name TEXT DEFAULT 'Mujahideen Preparatory School',
  motto TEXT DEFAULT '',
  location TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  "academicYear" TEXT DEFAULT '2025/2026',
  "currentTerm" TEXT DEFAULT 'Term 2',
  "termStart" TEXT DEFAULT '',
  "termEnd" TEXT DEFAULT '',
  "examWeight" INTEGER DEFAULT 50,
  "classWorkWeight" INTEGER DEFAULT 50,
  logo TEXT DEFAULT '',
  address TEXT DEFAULT '',
  "gradingScales" JSONB DEFAULT '[{"grade":"A1","minScore":80,"remark":"Excellent"},{"grade":"B2","minScore":70,"remark":"Very Good"},{"grade":"B3","minScore":60,"remark":"Good"},{"grade":"C4","minScore":55,"remark":"Credit"},{"grade":"C5","minScore":50,"remark":"Credit"},{"grade":"C6","minScore":45,"remark":"Credit"},{"grade":"D7","minScore":40,"remark":"Pass"},{"grade":"E8","minScore":35,"remark":"Pass"},{"grade":"F9","minScore":0,"remark":"Fail"}]',
  "whatsappApiKey" TEXT DEFAULT '',
  "aiTone" TEXT DEFAULT 'Professional',
  currency TEXT DEFAULT 'GHS',
  "receiptPrefix" TEXT DEFAULT 'MPS-',
  "momoNumber" TEXT DEFAULT '',
  "momoProvider" TEXT DEFAULT ''
);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  audience TEXT DEFAULT 'All',
  date TEXT DEFAULT '',
  read BOOLEAN DEFAULT false
);

-- 11. Timetable
CREATE TABLE IF NOT EXISTS timetable (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  period TEXT NOT NULL,
  subject TEXT DEFAULT '',
  teacher TEXT DEFAULT '',
  "className" TEXT DEFAULT ''
);

-- 12. Events (calendar)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT DEFAULT 'Event'
);

-- 13. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user_name TEXT DEFAULT 'System',
  user_role TEXT DEFAULT 'admin',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 14. Fee Structure
CREATE TABLE IF NOT EXISTS fee_structure (
  id TEXT PRIMARY KEY,
  "className" TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  description TEXT DEFAULT ''
);

-- 15. Library Books
CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  isbn TEXT DEFAULT '',
  category TEXT DEFAULT '',
  copies INTEGER DEFAULT 1,
  available INTEGER DEFAULT 1,
  location TEXT DEFAULT ''
);

-- 16. Library Issues
CREATE TABLE IF NOT EXISTS library_issues (
  id TEXT PRIMARY KEY,
  "bookId" TEXT NOT NULL,
  "bookTitle" TEXT DEFAULT '',
  "studentId" TEXT NOT NULL,
  "studentName" TEXT DEFAULT '',
  "issueDate" TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "returnDate" TEXT DEFAULT '',
  status TEXT DEFAULT 'Issued'
);

-- 17. Communications / Messages
CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sender TEXT DEFAULT '',
  recipients TEXT DEFAULT 'All',
  date TEXT DEFAULT '',
  type TEXT DEFAULT 'announcement'
);

-- 18. Discipline Records
CREATE TABLE IF NOT EXISTS discipline (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT DEFAULT '',
  action TEXT DEFAULT '',
  severity TEXT DEFAULT 'Low'
);

-- ============================================================
-- Row Level Security (RLS) — Open for authenticated users
-- In production, refine policies per role.
-- ============================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access (refine later per role)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'students','teachers','classes','subjects','attendance',
    'results','payments','expenses','settings','notifications',
    'timetable','events','activity_logs','fee_structure',
    'library_books','library_issues','communications','discipline'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "%s_auth_all" ON %I;', tbl, tbl);
      EXECUTE format('
        CREATE POLICY "%s_auth_all" ON %I
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
      ', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Also allow anon access for initial setup / demo (remove in production)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'students','teachers','classes','subjects','attendance',
    'results','payments','expenses','settings','notifications',
    'timetable','events','activity_logs','fee_structure',
    'library_books','library_issues','communications','discipline'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "%s_anon_all" ON %I;', tbl, tbl);
      EXECUTE format('
        CREATE POLICY "%s_anon_all" ON %I
          FOR ALL
          TO anon
          USING (true)
          WITH CHECK (true);
      ', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance("studentId");
CREATE INDEX IF NOT EXISTS idx_results_student ON results("studentId");
CREATE INDEX IF NOT EXISTS idx_results_class ON results(class);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments("studentId");
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ts ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable("className");
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
