-- Drop the existing read filtered policy
DROP POLICY IF EXISTS "notif read filtered" ON public.notifications;

-- Create the tightened notifications RLS policy
CREATE POLICY "notif read filtered" ON public.notifications FOR SELECT TO authenticated USING (
  -- Admins can read everything
  public.is_admin(auth.uid())
  
  -- Teachers' rules
  OR (
    public.has_role(auth.uid(), 'teacher')
    AND (audience = 'All' OR audience = 'Teachers')
    -- Exclude finance, HR, developer, and administrative secrets
    AND NOT (
      title ~* '(fee|payment|outstanding|balance|momo|financial|paid|wallet|revenue|invoice|receipt|cost|price|salary|wages|remuneration|payroll)'
      OR message ~* '(fee|payment|outstanding|balance|momo|financial|paid|wallet|revenue|invoice|receipt|cost|price|salary|wages|remuneration|payroll)'
      OR title ~* '(performance review|leave approval|salary details|disciplinary action|staff recruitment|internal investigation|HR memo|confidential memo|management strategy|strategic plan|conflict resolution|leadership meeting)'
      OR message ~* '(performance review|leave approval|salary details|disciplinary action|staff recruitment|internal investigation|HR memo|confidential memo|management strategy|strategic plan|conflict resolution|leadership meeting)'
      OR title ~* '(deployment|database error|api gateway|error log|system config|postgres|backend|connection limit|rls policy|developer|debug)'
      OR message ~* '(deployment|database error|api gateway|error log|system config|postgres|backend|connection limit|rls policy|developer|debug)'
      OR title ~* '(complaint about|sensitive family|financial hardship|fee negotiation|negotiated fee|hardship discount|negotiated payment)'
      OR message ~* '(complaint about|sensitive family|financial hardship|fee negotiation|negotiated fee|hardship discount|negotiated payment)'
    )
    -- Exclude notifications for classes they do not teach
    AND (
      -- If it mentions a class name, the teacher must be assigned to that class
      NOT EXISTS (
        SELECT 1 
        FROM (
          SELECT unnest(ARRAY['Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JHS 1', 'JHS 2', 'JHS 3']) AS class_name
        ) c
        WHERE (title ~* class_name OR message ~* class_name)
        AND class_name NOT IN (
          -- Query teacher's assigned classes from database
          SELECT name FROM public.classes WHERE teacher = (
            SELECT name FROM public.teachers WHERE user_id = auth.uid() LIMIT 1
          )
          UNION ALL
          SELECT regexp_split_to_table(classes, ',\s*') FROM public.teachers WHERE user_id = auth.uid()
        )
      )
    )
  )

  -- Parents' rules
  OR (
    public.has_role(auth.uid(), 'parent')
    AND (audience = 'All' OR audience = 'Parents')
    -- If it contains financial keywords, it must mention one of their children's names
    AND (
      NOT (title ~* '(fee|payment|outstanding|balance|momo|paid|receipt|invoice)' OR message ~* '(fee|payment|outstanding|balance|momo|paid|receipt|invoice)')
      OR EXISTS (
        SELECT 1 
        FROM public.parent_students ps
        JOIN public.students s ON s.id = ps.student_id
        WHERE ps.parent_user_id = auth.uid()
        AND (title ~* s.name OR message ~* s.name)
      )
    )
    -- If it contains student sensitive keywords, it must mention one of their children or their classes
    AND (
      NOT (title ~* '(behaviour|misconduct|disciplinary|exam result|grades|report card|academic report|report sheet|marks|score|attendance)' OR message ~* '(behaviour|misconduct|disciplinary|exam result|grades|report card|academic report|report sheet|marks|score|attendance)')
      OR EXISTS (
        SELECT 1
        FROM public.parent_students ps
        JOIN public.students s ON s.id = ps.student_id
        WHERE ps.parent_user_id = auth.uid()
        AND (
          title ~* s.name OR message ~* s.name
          OR title ~* s.class OR message ~* s.class
        )
      )
    )
    -- Exclude staff duty rosters or HR notices
    AND NOT (
      title ~* '(staff meeting|duty roster|relief teaching|substitution request|supervision period|teacher attendance)'
      OR message ~* '(staff meeting|duty roster|relief teaching|substitution request|supervision period|teacher attendance)'
    )
  )
);
