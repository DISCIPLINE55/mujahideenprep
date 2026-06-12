-- Migration: add exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    academic_year TEXT,
    academic_term TEXT,
    class_name TEXT,
    subject TEXT,
    exam_type TEXT,
    duration TEXT,
    instructions TEXT,
    content TEXT,
    created_by TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Policies for Admins (Assuming admins are identified by a role claim or metadata, but usually school-harmony relies on the application logic for sync, however we can restrict row visibility based on created_by for teachers).
-- We'll allow all inserts, but only allow fetching exams if the user is admin, or if created_by matches their user_id, or if they are just trusting the application to do it.
-- Since the application uses a shared JWT for simplicity and relies on offline sync filtering, we will implement RLS based on the JWT `role` or simple application level filtering if the JWT structure isn't fully defined for all users.
-- Assuming standard Supabase auth:
CREATE POLICY "Enable read access for all authenticated users"
ON exams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for all authenticated users"
ON exams FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for all authenticated users"
ON exams FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- We'll add the touch_updated_at trigger
CREATE TRIGGER handle_updated_at_exams
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
