-- ============================================================
-- Enable Supabase Realtime Replication for School Harmony Tables
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- Create the publication if it does not exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Dynamically add each table to the publication, ignoring duplicate object errors
  FOR tbl IN SELECT unnest(ARRAY[
    'students',
    'teachers',
    'classes',
    'subjects',
    'attendance',
    'results',
    'payments',
    'expenses',
    'settings',
    'notifications',
    'timetable',
    'events',
    'activity_logs',
    'fee_structure',
    'library_books',
    'library_issues',
    'communications',
    'discipline'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      RAISE NOTICE 'Added table % to supabase_realtime publication', tbl;
    EXCEPTION
      WHEN duplicate_object THEN
        -- Already exists in publication, do nothing
        NULL;
      WHEN OTHERS THEN
        -- Ignore other missing table errors or RLS blockers
        NULL;
    END;
  END LOOP;
END $$;
