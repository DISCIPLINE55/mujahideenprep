-- ============================================================
-- Sync Engine Schema Overhaul: Add updated_at and is_deleted
-- ============================================================

-- Ensure touch_updated_at helper function exists and is secure definer
create or replace function public.touch_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Drop function execute permissions from public/anon/auth
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Helper block to dynamically add columns and triggers to all tables
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'students','teachers','classes','subjects','attendance',
    'results','payments','expenses','settings','timetable',
    'events','notifications','discipline_records','library_books',
    'library_issues','communications'
  ]) loop
    -- 1. Add updated_at column if not exists
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now();', tbl);
    
    -- 2. Add is_deleted column if not exists
    execute format('alter table public.%I add column if not exists is_deleted boolean not null default false;', tbl);
    
    -- 3. Drop existing trigger if exists
    execute format('drop trigger if exists trg_%s_updated_at on public.%I;', tbl, tbl);
    
    -- 4. Create trigger to touch updated_at before update
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.touch_updated_at();', tbl, tbl);
    
    raise notice 'Updated table schema and triggers for: %', tbl;
  end loop;
end $$;

-- Add is_deleted to profiles (updated_at already exists)
alter table public.profiles add column if not exists is_deleted boolean not null default false;
