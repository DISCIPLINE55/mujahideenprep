# Batch 1 — Security & Real-World Provisioning

## Why this batch matters

The public database has no tables. All data is local-only and never reaches the cloud. Before adding RLS, we must create the schema. Then we lock it down, add the missing admin tools to provision real users, and ship password recovery.

---

## 1. Create the real database schema

Add these tables in `public`, all with RLS enabled:

- `profiles` — id (uuid → auth.users), full_name, email, phone, avatar_url
- `user_roles` — id, user_id, role (enum: admin, teacher, parent) — separate table per security best practice
- `parent_students` — parent_user_id, student_id (links a parent account to one or more students)
- `teacher_assignments` — teacher_user_id, class_id (which classes a teacher owns)
- `students`, `teachers`, `classes`, `subjects` — core entities
- `attendance`, `results`, `payments`, `expenses`, `timetable`, `events`, `notifications`, `discipline_records`, `activity_logs`, `library_books`

Add a `has_role(user_id, role)` SECURITY DEFINER function (avoids RLS recursion).

Add a trigger on `auth.users` insert → create matching `profiles` row.

## 2. RLS policies (the actual security layer)

Per role:

- **Admin**: full read/write on everything (`has_role(auth.uid(),'admin')`)
- **Teacher**: read all students/classes; write only `attendance`, `results`, `discipline_records` for classes in their `teacher_assignments`
- **Parent**: read-only on their own children (joined via `parent_students`) — students, results, attendance, payments, fees. Nothing else.
- **All authenticated**: read `notifications` filtered by audience; read `events`/`timetable`

Public/anon: no access to anything.

## 3. Migrate the existing `useStore` hook

- On first login after migration, push any existing localStorage data up to Supabase (one-time seed) so the school doesn't lose what's already entered.
- Switch `useStore` to **cloud-first**: read from Supabase, cache in localStorage for offline view, write-through on mutations.
- Show a toast when cloud sync fails instead of silently swallowing the error.

## 4. Parent ↔ Student linking UI (Admin only)

New page `/students/$studentId` gets a **"Linked Parents"** section:

- List current parent accounts linked
- Button: "Invite Parent" → modal with email input → creates auth user (admin API via server function) with role=parent, inserts row in `parent_students`, sends invite email
- Button: "Unlink" per parent

Also new admin page `/parents` listing all parent accounts and their linked children, with bulk-link tool.

## 5. Forgot password flow

- Add "Forgot password?" link on login screen
- New route `/forgot-password` — email input → `supabase.auth.resetPasswordForEmail`
- New route `/reset-password` — handles the recovery callback, lets user set new password
- Wire up branded auth email templates (password reset + email verification) using the school's green branding

## 6. Leaked password protection (HIBP)

Enable Have-I-Been-Pwned check on signup and password change. One-line auth config — blocks weak/leaked passwords system-wide.

---

## Technical notes

- Use `createServerFn` + `requireSupabaseAuth` middleware for any mutation that needs the current user's identity (RLS-respecting).
- Use `supabaseAdmin` (service role) **only** inside server functions for admin-only tasks like creating parent accounts via invite.
- `user_roles` MUST be a separate table — never store role on `profiles` (privilege escalation risk).
- `has_role()` must be `SECURITY DEFINER` with `set search_path = public` to prevent RLS recursion.
- Keep the existing `getAuth()` / `getAuthSync()` shape so the rest of the app keeps working — just have it pull `role` from `user_roles` instead of user metadata.

## Files touched (new + edited)

- **New migrations:** schema for all tables, RLS policies, `has_role` function, profiles trigger
- **New routes:** `/forgot-password`, `/reset-password`, `/parents`
- **New server functions:** `inviteParent`, `linkParentStudent`, `unlinkParentStudent`, `seedFromLocal`
- **Edited:** `src/hooks/use-store.ts` (cloud-first), `src/lib/auth.ts` (role from user_roles), `src/routes/index.tsx` (forgot link), `src/routes/_app.students.$studentId.tsx` (linked parents section)

## Out of scope (saved for Batch 2)

Loading skeletons, CSV bulk import, exportable reports, email notifications for fee reminders.

---

After approval I'll execute all of this in one pass. Estimated to be the most impactful change since the project started — turns the prototype into a multi-device, properly-secured system. also make sure the current admin is update to mujahideen216@gmail.com