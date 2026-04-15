

# MPSMS Frontend Enhancement Plan — Remaining Features & Polish

## Current State

The system already has: login, dashboard with charts, full CRUD for students/teachers/classes/subjects, attendance marking, exam results with report cards, fee management with receipts, timetable, notifications, CSV export, dark mode, auth guard, logout, SEO metadata, and debounced search.

## What's Still Missing (Frontend Only, No Backend)

### 1. Teacher Profile Page
- Create `src/routes/_app.teachers.$teacherId.tsx`
- Shows teacher info, assigned classes, subjects, and timetable slots
- Linked from teacher table rows (add Eye icon button like students page)

### 2. Academic Calendar / Events Management
- Dashboard currently has hardcoded events — make them dynamic
- Add an events section in Settings or a new page where admin can CRUD events (title, date, type)
- Store in localStorage, display on dashboard

### 3. Data Backup & Restore
- In Settings, add "Export All Data" button (downloads a single JSON file with all localStorage data)
- Add "Import Data" button to restore from that JSON file
- Prevents data loss since everything is in localStorage

### 4. Attendance Summary Dashboard
- On the attendance page, add a summary view: daily/weekly attendance rates per class
- Add an attendance trend chart (like the bar chart on dashboard but for attendance over time)

### 5. Print Styles
- Add proper `@media print` CSS so report cards and fee receipts render cleanly when printed
- Hide sidebar, topbar, buttons during print

### 6. Better Mobile Experience
- The mobile sidebar toggle exists but test/fix: ensure forms, tables, and timetable grid are usable on small screens
- Make timetable horizontally scrollable on mobile
- Stack form fields vertically on mobile

### 7. Forgot Password Flow (Mock)
- Add "Forgot Password?" link on login page
- Opens a dialog/page where admin enters email, shows a mock success message
- No real email — just UI completeness

### 8. Loading Skeletons
- Add skeleton placeholders when pages first load (before localStorage data is read)
- Use existing `skeleton.tsx` component on dashboard stats, tables

### 9. Bulk Actions on Tables
- Add checkbox column to Students and Teachers tables
- "Select All" + bulk delete, bulk status change
- Improves admin workflow

### 10. Student Photo/Avatar
- In the Add/Edit Student form, add a field for pasting an image URL (or a placeholder initial avatar)
- Display on student profile page and in tables

---

## Technical Details

### New Files
- `src/routes/_app.teachers.$teacherId.tsx` — teacher profile page

### Files to Modify
- `src/routes/_app.dashboard.tsx` — dynamic events from localStorage
- `src/routes/_app.teachers.tsx` — add view profile link, bulk actions
- `src/routes/_app.students.tsx` — bulk actions, photo field
- `src/routes/_app.attendance.tsx` — summary stats view
- `src/routes/_app.settings.tsx` — backup/restore section
- `src/routes/index.tsx` — forgot password link/dialog
- `src/routes/_app.timetable.tsx` — mobile scroll fix
- `src/lib/storage.ts` — add Event type, photo field to Student
- `src/styles.css` — print styles

### No new dependencies needed

### Implementation Order
1. Teacher profile + student photo field
2. Dynamic events + backup/restore
3. Attendance summary + print styles
4. Forgot password + loading skeletons + bulk actions + mobile fixes

