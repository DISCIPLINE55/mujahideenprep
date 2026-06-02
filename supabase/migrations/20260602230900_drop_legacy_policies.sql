-- ============================================================
-- Drop Legacy Permissive Wildcard Policies on All Tables
-- ============================================================

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
      EXECUTE format('DROP POLICY IF EXISTS "%s_auth_all" ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "%s_anon_all" ON public.%I;', tbl, tbl);
      RAISE NOTICE 'Dropped legacy policies for table %', tbl;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore errors if table or policies do not exist
        NULL;
    END;
  END LOOP;
END $$;
