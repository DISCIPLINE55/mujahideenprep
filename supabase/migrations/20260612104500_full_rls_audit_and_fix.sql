-- ============================================================
-- Full RLS Audit & Enforcement Migration
-- Drops legacy/conflicting policies and establishes strict RBAC
-- Roles: Admin, Teacher, Parent
-- ============================================================

-- 1. Helper Functions for RBAC
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role::text=_role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role::text='admin');
$$;

-- Temporary Compatibility Helper for string-based classes
CREATE OR REPLACE FUNCTION public.teacher_has_class(_user_id uuid, _class text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.teachers
    WHERE user_id = _user_id::text
    AND _class = ANY(string_to_array(replace(classes, ', ', ','), ','))
  );
$$;

-- Helper for Parent-Student relationship mapping
CREATE OR REPLACE FUNCTION public.parent_owns_student_text(_user_id uuid, _student_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.parent_students
    WHERE parent_user_id = _user_id
    AND student_id::text = _student_id
  );
$$;


-- 2. Systematically Drop All Existing Policies
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'students','teachers','classes','subjects','attendance',
    'results','payments','expenses','settings','notifications',
    'timetable','events','activity_logs','fee_structure',
    'library_books','library_issues','communications','discipline',
    'profiles', 'user_roles', 'parent_students', 'exams'
  ]) LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;


-- 3. Enable RLS on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'students','teachers','classes','subjects','attendance',
    'results','payments','expenses','settings','notifications',
    'timetable','events','activity_logs','fee_structure',
    'library_books','library_issues','communications','discipline',
    'profiles', 'user_roles', 'parent_students', 'exams'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;


-- 4. Apply Strict RBAC Policies

-- =========================================
-- GLOBAL ADMIN ACCESS (ALL TABLES)
-- =========================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'students','teachers','classes','subjects','attendance',
    'results','payments','expenses','settings','notifications',
    'timetable','events','activity_logs','fee_structure',
    'library_books','library_issues','communications','discipline',
    'profiles', 'user_roles', 'parent_students', 'exams'
  ]) LOOP
    EXECUTE format('
      CREATE POLICY "rbac_admin_all" ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
    ', tbl);
  END LOOP;
END $$;


-- =========================================
-- TEACHER ACCESS
-- =========================================

-- Students: Read/Write if in assigned classes
CREATE POLICY "rbac_teacher_read" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class));
CREATE POLICY "rbac_teacher_write" ON public.students FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class)) WITH CHECK (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class));

-- Results: Read/Write if in assigned classes
CREATE POLICY "rbac_teacher_read" ON public.results FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class));
CREATE POLICY "rbac_teacher_write" ON public.results FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class)) WITH CHECK (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class));

-- Attendance: Read/Write if in assigned classes
CREATE POLICY "rbac_teacher_read" ON public.attendance FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class));
CREATE POLICY "rbac_teacher_write" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class)) WITH CHECK (public.has_role(auth.uid(), 'teacher') AND public.teacher_has_class(auth.uid(), class));

-- Teachers table: Teachers can view themselves
CREATE POLICY "rbac_teacher_read" ON public.teachers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND user_id = auth.uid()::text);

-- Notifications: Teachers see specific audiences
CREATE POLICY "rbac_teacher_read" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND (audience = 'All' OR audience = 'Teachers'));

-- Payments/Expenses: NO ACCESS (Omitted)

-- Exams: Read/Write exams they created
CREATE POLICY "rbac_teacher_read" ON public.exams FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "rbac_teacher_write" ON public.exams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher') AND created_by = auth.uid()::text) WITH CHECK (public.has_role(auth.uid(), 'teacher') AND created_by = auth.uid()::text);


-- =========================================
-- PARENT ACCESS
-- =========================================

-- Students: Read linked children
CREATE POLICY "rbac_parent_read" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'parent') AND public.parent_owns_student_text(auth.uid(), id));

-- Results: Read linked children
CREATE POLICY "rbac_parent_read" ON public.results FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'parent') AND public.parent_owns_student_text(auth.uid(), "studentId"));

-- Attendance: Read linked children
CREATE POLICY "rbac_parent_read" ON public.attendance FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'parent') AND public.parent_owns_student_text(auth.uid(), "studentId"));

-- Payments: Read linked children
CREATE POLICY "rbac_parent_read" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'parent') AND public.parent_owns_student_text(auth.uid(), "studentId"));

-- Profiles/Roles/Links: Read own data
CREATE POLICY "rbac_parent_read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "rbac_parent_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rbac_parent_read" ON public.parent_students FOR SELECT TO authenticated USING (parent_user_id = auth.uid());

-- Notifications: Parents see specific audiences
CREATE POLICY "rbac_parent_read" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'parent') AND (audience = 'All' OR audience = 'Parents'));


-- =========================================
-- COMMON SHARED ACCESS (Settings/Read-Only)
-- =========================================

-- Settings: All authenticated users can read (Admin manages via rbac_admin_all)
CREATE POLICY "rbac_auth_read" ON public.settings FOR SELECT TO authenticated USING (true);

-- Classes/Subjects: All authenticated users can read
CREATE POLICY "rbac_auth_read" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbac_auth_read" ON public.subjects FOR SELECT TO authenticated USING (true);

-- No policies granted to `anon` role anywhere.
