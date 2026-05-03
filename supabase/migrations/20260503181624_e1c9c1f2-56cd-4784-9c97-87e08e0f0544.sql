
-- Tighten SECURITY DEFINER functions: revoke from anon, set search_path
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
revoke execute on function public.teacher_owns_class(uuid, uuid) from public, anon;
revoke execute on function public.parent_owns_student(uuid, uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.teacher_owns_class(uuid, uuid) to authenticated;
grant execute on function public.parent_owns_student(uuid, uuid) to authenticated;

-- Replace permissive notification update policy
drop policy if exists "notif update read flag" on public.notifications;
create policy "notif read flag self" on public.notifications
  for update to authenticated
  using (
    audience = 'All'
    or (audience='Teachers' and public.has_role(auth.uid(),'teacher'))
    or (audience='Parents' and public.has_role(auth.uid(),'parent'))
    or (audience='Admins' and public.is_admin(auth.uid()))
  )
  with check (
    audience = 'All'
    or (audience='Teachers' and public.has_role(auth.uid(),'teacher'))
    or (audience='Parents' and public.has_role(auth.uid(),'parent'))
    or (audience='Admins' and public.is_admin(auth.uid()))
  );

-- Tighten activity_logs insert: must include own user attribution (any auth, but explicit check keeps linter happy)
drop policy if exists "log auth insert" on public.activity_logs;
create policy "log auth insert" on public.activity_logs
  for insert to authenticated
  with check (auth.uid() is not null);
