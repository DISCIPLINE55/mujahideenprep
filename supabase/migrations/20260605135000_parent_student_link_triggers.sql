-- ============================================================
-- Parent-Student Auto-Linking Triggers & Metadata Sync
-- ============================================================

-- 1. Update handle_new_user to copy phone from metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.phone, new.raw_user_meta_data->>'phone')
  )
  on conflict (id) do update set
    phone = coalesce(excluded.phone, profiles.phone),
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = coalesce(excluded.email, profiles.email),
    updated_at = now();

  -- Dynamic Bootstrap: If no admin account exists yet, assign 'admin' role. Otherwise, assign 'parent'.
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  else
    insert into public.user_roles(user_id, role) values (new.id, 'parent')
    on conflict do nothing;
  end if;
  return new;
end; $$;

-- 2. Trigger function to link parents when student is created or updated
create or replace function public.auto_link_parent_on_student()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.phone is not null and NEW.phone <> '' then
    insert into public.parent_students(parent_user_id, student_id)
    select id, NEW.id
    from public.profiles
    where phone = NEW.phone
    on conflict (parent_user_id, student_id) do nothing;
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_auto_link_parent_on_student_insert on public.students;
create trigger trg_auto_link_parent_on_student_insert
  after insert or update of phone on public.students
  for each row execute function public.auto_link_parent_on_student();

-- 3. Trigger function to link students when parent profile is created or updated
create or replace function public.auto_link_parent_on_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.phone is not null and NEW.phone <> '' then
    insert into public.parent_students(parent_user_id, student_id)
    select NEW.id, id
    from public.students
    where phone = NEW.phone
    on conflict (parent_user_id, student_id) do nothing;
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_auto_link_parent_on_profile_update on public.profiles;
create trigger trg_auto_link_parent_on_profile_update
  after insert or update of phone on public.profiles
  for each row execute function public.auto_link_parent_on_profile();

-- 4. Backfill existing phone number matches
insert into public.parent_students (parent_user_id, student_id)
select p.id, s.id
from public.profiles p
join public.students s on s.phone = p.phone
where p.phone is not null and p.phone <> '' and s.phone is not null and s.phone <> ''
on conflict (parent_user_id, student_id) do nothing;
