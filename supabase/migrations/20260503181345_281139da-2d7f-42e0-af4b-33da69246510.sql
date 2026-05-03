
-- ============ ROLES ============
create type public.app_role as enum ('admin','teacher','parent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role='admin')
$$;

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Profile auto-create + admin bootstrap
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;

  -- Bootstrap the school admin
  if new.email = 'mujahideen216@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ LINK TABLES ============
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text,
  academic_year text,
  created_at timestamptz not null default now()
);
alter table public.classes enable row level security;

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  subject text,
  hire_date date,
  created_at timestamptz not null default now()
);
alter table public.teachers enable row level security;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date,
  gender text,
  class_id uuid references public.classes(id) on delete set null,
  parent_name text,
  parent_phone text,
  admission_no text unique,
  created_at timestamptz not null default now()
);
alter table public.students enable row level security;

create table public.parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  unique(parent_user_id, student_id)
);
alter table public.parent_students enable row level security;

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  unique(teacher_user_id, class_id)
);
alter table public.teacher_assignments enable row level security;

create or replace function public.teacher_owns_class(_user_id uuid, _class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.teacher_assignments where teacher_user_id=_user_id and class_id=_class_id)
$$;

create or replace function public.parent_owns_student(_user_id uuid, _student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.parent_students where parent_user_id=_user_id and student_id=_student_id)
$$;

-- ============ DOMAIN TABLES ============
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  level text,
  created_at timestamptz not null default now()
);
alter table public.subjects enable row level security;

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  date date not null,
  status text not null,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.attendance enable row level security;

create table public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  term text,
  academic_year text,
  score numeric,
  grade text,
  remarks text,
  ai_comment text,
  created_at timestamptz not null default now()
);
alter table public.results enable row level security;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric not null,
  term text,
  academic_year text,
  payment_date date not null default current_date,
  method text,
  receipt_no text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text,
  amount numeric not null,
  description text,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;

create table public.timetable (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_user_id uuid references auth.users(id) on delete set null,
  day_of_week text,
  start_time time,
  end_time time,
  created_at timestamptz not null default now()
);
alter table public.timetable enable row level security;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  audience text not null default 'All',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

create table public.discipline_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  incident_date date not null default current_date,
  severity text,
  description text,
  action_taken text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.discipline_records enable row level security;

create table public.library_books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  isbn text,
  copies integer not null default 1,
  available integer not null default 1,
  created_at timestamptz not null default now()
);
alter table public.library_books enable row level security;

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  user_name text,
  user_role text,
  timestamp timestamptz not null default now()
);
alter table public.activity_logs enable row level security;

-- ============ POLICIES ============

-- profiles: each user reads/updates own; admins read all
create policy "profiles self read" on public.profiles for select using (auth.uid()=id or public.is_admin(auth.uid()));
create policy "profiles self update" on public.profiles for update using (auth.uid()=id);
create policy "profiles admin all" on public.profiles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- user_roles: only admins manage; users see their own
create policy "roles self read" on public.user_roles for select using (auth.uid()=user_id or public.is_admin(auth.uid()));
create policy "roles admin manage" on public.user_roles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- classes / subjects / teachers: all authenticated read; admin manages
create policy "classes read auth" on public.classes for select to authenticated using (true);
create policy "classes admin manage" on public.classes for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "subjects read auth" on public.subjects for select to authenticated using (true);
create policy "subjects admin manage" on public.subjects for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "teachers read auth" on public.teachers for select to authenticated using (true);
create policy "teachers admin manage" on public.teachers for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- students: admin all; teachers all read; parents only their own
create policy "students admin manage" on public.students for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "students teacher read" on public.students for select using (public.has_role(auth.uid(),'teacher'));
create policy "students parent read" on public.students for select using (public.parent_owns_student(auth.uid(), id));

-- parent_students / teacher_assignments
create policy "ps admin manage" on public.parent_students for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "ps parent read self" on public.parent_students for select using (auth.uid()=parent_user_id);

create policy "ta admin manage" on public.teacher_assignments for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "ta teacher read self" on public.teacher_assignments for select using (auth.uid()=teacher_user_id);

-- attendance: admin all; teachers manage own classes; parents read own kids
create policy "att admin manage" on public.attendance for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "att teacher read" on public.attendance for select using (public.has_role(auth.uid(),'teacher'));
create policy "att teacher write" on public.attendance for insert with check (public.teacher_owns_class(auth.uid(), class_id));
create policy "att teacher update" on public.attendance for update using (public.teacher_owns_class(auth.uid(), class_id));
create policy "att parent read" on public.attendance for select using (public.parent_owns_student(auth.uid(), student_id));

-- results
create policy "res admin manage" on public.results for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "res teacher read" on public.results for select using (public.has_role(auth.uid(),'teacher'));
create policy "res teacher write" on public.results for insert with check (public.teacher_owns_class(auth.uid(), class_id));
create policy "res teacher update" on public.results for update using (public.teacher_owns_class(auth.uid(), class_id));
create policy "res parent read" on public.results for select using (public.parent_owns_student(auth.uid(), student_id));

-- payments
create policy "pay admin manage" on public.payments for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "pay parent read" on public.payments for select using (public.parent_owns_student(auth.uid(), student_id));

-- expenses (admin only)
create policy "exp admin manage" on public.expenses for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- timetable: admin manage; all auth read
create policy "tt admin manage" on public.timetable for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "tt read auth" on public.timetable for select to authenticated using (true);

-- events: admin manage; all auth read
create policy "ev admin manage" on public.events for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "ev read auth" on public.events for select to authenticated using (true);

-- notifications: admin manage; audience-filtered read
create policy "notif admin manage" on public.notifications for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "notif read filtered" on public.notifications for select to authenticated using (
  audience = 'All'
  or (audience='Teachers' and public.has_role(auth.uid(),'teacher'))
  or (audience='Parents' and public.has_role(auth.uid(),'parent'))
  or (audience='Admins' and public.is_admin(auth.uid()))
);
create policy "notif update read flag" on public.notifications for update to authenticated using (true);

-- discipline: admin all; teachers write for own classes; parent read own kids
create policy "disc admin manage" on public.discipline_records for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "disc teacher read" on public.discipline_records for select using (public.has_role(auth.uid(),'teacher'));
create policy "disc teacher write" on public.discipline_records for insert with check (public.has_role(auth.uid(),'teacher'));
create policy "disc parent read" on public.discipline_records for select using (public.parent_owns_student(auth.uid(), student_id));

-- library: admin manage; all auth read
create policy "lib admin manage" on public.library_books for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "lib read auth" on public.library_books for select to authenticated using (true);

-- activity_logs: admin read; any auth insert (server attribution)
create policy "log admin read" on public.activity_logs for select using (public.is_admin(auth.uid()));
create policy "log auth insert" on public.activity_logs for insert to authenticated with check (true);
