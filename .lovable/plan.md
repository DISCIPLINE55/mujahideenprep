

# MPSMS — Ultimate Enhancement Plan: AI Integration, Role-Based Login, and Professional Features

## Summary

Transform the school management system into a unique, AI-powered platform with role-based authentication (Admin, Teacher, Parent), an AI assistant, AI-powered report generation, and several missing professional modules — all while keeping localStorage as the data layer until backend migration.

---

## Phase 1: Role-Based Login System

### Multi-Role Authentication
- Redesign the login page with a **role selector** (Admin, Teacher, Parent)
- **Admin**: full access to all modules (current behavior)
- **Teacher**: access to their assigned classes, attendance marking, results entry, timetable, and their profile
- **Parent**: read-only access to their child's profile, attendance, results, and fee status
- Store role in `mpsms_auth` localStorage object
- Update `_app.tsx` auth guard to pass role context
- Conditionally show/hide sidebar items based on role
- Default credentials: Admin (admin/admin123), Teacher (teacher/teacher123), Parent (parent/parent123)

### Teacher Dashboard
- New route `_app.teacher-dashboard.tsx` — shows only assigned classes, upcoming periods, attendance to mark today
- Replaces the admin dashboard when logged in as Teacher

### Parent Dashboard
- New route `_app.parent-dashboard.tsx` — shows child's attendance rate, latest results, fee balance, upcoming events
- Clean, card-based read-only view

---

## Phase 2: AI-Powered Features (via Lovable AI Edge Function)

### AI Assistant Chatbot
- New route `_app.ai-assistant.tsx` with a chat interface
- Edge function `supabase/functions/school-ai/index.ts` calling Lovable AI Gateway
- System prompt: "You are an AI assistant for Mujahideen Preparatory School Management System. Help with student performance analysis, attendance insights, report writing, timetable suggestions, and school administration tasks."
- Streaming responses rendered with markdown
- Add "AI Assistant" to sidebar with a sparkle icon

### AI Report Card Comments
- On the Results page, add "Generate AI Comment" button per student result
- Calls edge function to generate personalized teacher remarks based on scores (e.g., "Amina excels in Mathematics but needs improvement in French. Overall a diligent student.")
- Auto-fills the remarks field

### AI Attendance Insights
- On the Attendance page summary section, add "AI Analysis" button
- Sends attendance data to AI, returns insights like "Class JHS 3 has declining attendance on Fridays. 3 students have been absent more than 5 days this term."

### AI Fee Reminders
- On the Fees page, add "Generate Reminder" button for students with unpaid/partial fees
- AI generates a polite SMS/letter template addressed to the guardian

### AI Timetable Suggestions
- On the Timetable page, add "AI Suggest" button
- Based on existing slots, teachers, and subjects, AI suggests optimal slot assignments to avoid conflicts

---

## Phase 3: Missing Professional Modules

### Academic Calendar Page
- New route `_app.calendar.tsx` with a full monthly calendar view
- Shows events, exams, holidays color-coded
- CRUD events inline on the calendar
- Add to sidebar

### Library Management (Basic)
- New route `_app.library.tsx`
- Track books (title, author, ISBN, quantity, category)
- Issue/return books to students
- localStorage CRUD

### Communication / SMS Log
- New route `_app.communications.tsx`
- Log of messages sent to parents (mock)
- Compose new message with AI-generated templates
- Audience filter: individual parent, class, all

### Student Discipline Records
- Add a "Discipline" tab on the student profile page
- Record incidents (date, description, action taken, severity)
- Helps track behavioral patterns

### Report Generation Page
- New route `_app.reports.tsx`
- Pre-built reports: Class performance summary, Fee collection report, Attendance summary by term, Teacher workload report
- Each generates a printable table with school branding
- AI can summarize findings

---

## Phase 4: UI/UX Professional Polish

### Animated Dashboard
- Add count-up animations on stat cards
- Smooth chart transitions
- Welcome message with time-of-day greeting ("Good morning, Admin")

### Global Command Palette
- Press `Ctrl+K` to open a search dialog
- Quick-jump to any student, teacher, class, or page
- Powered by existing localStorage data

### Activity Log
- Track recent actions (student added, attendance marked, payment recorded)
- Show on dashboard as "Recent Activity" feed
- Store last 50 actions in localStorage

### Custom Branding on Prints
- All printed documents (report cards, receipts, reports) include school logo, name, motto, address
- Consistent header/footer on all printable views

---

## Technical Details

### New Edge Function
- `supabase/functions/school-ai/index.ts` — handles all AI requests (chat, comments, insights, reminders, suggestions) with a `type` field to branch logic

### New Route Files
- `src/routes/_app.ai-assistant.tsx`
- `src/routes/_app.teacher-dashboard.tsx`
- `src/routes/_app.parent-dashboard.tsx`
- `src/routes/_app.calendar.tsx`
- `src/routes/_app.library.tsx`
- `src/routes/_app.communications.tsx`
- `src/routes/_app.reports.tsx`

### Files to Modify
- `src/routes/index.tsx` — role selector on login
- `src/routes/_app.tsx` — role-based routing and sidebar filtering
- `src/components/layout/AppSidebar.tsx` — role-conditional nav items, AI Assistant link
- `src/routes/_app.results.tsx` — AI comment generation button
- `src/routes/_app.attendance.tsx` — AI insights button
- `src/routes/_app.fees.tsx` — AI reminder generation
- `src/routes/_app.timetable.tsx` — AI suggestion button
- `src/routes/_app.students.$studentId.tsx` — discipline records tab
- `src/routes/_app.dashboard.tsx` — animated stats, activity log, greeting
- `src/lib/storage.ts` — new types (LibraryBook, DisciplineRecord, ActivityLog, Communication)

### Dependencies to Add
- `react-markdown` — for rendering AI chat responses

### Implementation Order
1. **Batch 1**: Role-based login + teacher/parent dashboards + sidebar role filtering
2. **Batch 2**: AI edge function + AI assistant chat page + AI report comments
3. **Batch 3**: AI attendance insights + fee reminders + timetable suggestions
4. **Batch 4**: Calendar, library, communications, reports, discipline records
5. **Batch 5**: Command palette, animated stats, activity log, print branding polish

