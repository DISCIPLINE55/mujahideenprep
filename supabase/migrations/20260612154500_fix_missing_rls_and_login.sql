-- Fix missing read policies for authenticated users

CREATE POLICY "rbac_auth_read_classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbac_auth_read_subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbac_auth_read_timetable" ON public.timetable FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbac_auth_read_events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbac_auth_read_communications" ON public.communications FOR SELECT TO authenticated USING (true);

-- Ensure user_roles has explicit policies for all authenticated users to read their own roles
-- (Note: 'rbac_parent_read' already exists with user_id = auth.uid(), but just to be safe)
CREATE POLICY "rbac_auth_read_own_role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
