
Looking at what's been built vs. the original Ultimate Plan, here's what's still pending (frontend-only, no backend needed).

# What's Left to Build (Frontend Only)

## 1. AI Features Not Yet Wired In
The AI edge function exists but these buttons aren't added yet:
- **AI Report Card Comments** on `_app.results.tsx` — "Generate AI Comment" button per student that auto-fills remarks
- **AI Attendance Insights** on `_app.attendance.tsx` — "AI Analysis" button on the summary section
- **AI Fee Reminders** on `_app.fees.tsx` — "Generate Reminder" button for unpaid/partial students
- **AI Timetable Suggestions** on `_app.timetable.tsx` — "AI Suggest" button to fill empty slots

## 2. Student Discipline Records
- Add a "Discipline" tab on `_app.students.$studentId.tsx`
- CRUD incidents (date, description, action taken, severity)
- New `DisciplineRecord` type in `storage.ts`

## 3. Library Issue/Return Tracking
- The library page exists but only tracks books — add the issue/return flow
- Track which student has which book, due date, return status

## 4. Communications Enhancements
- Add AI-powered template generation to the compose form
- Audience filtering: individual parent / class / all

## 5. Reports Polish
- Add AI summary button on each report
- Add print-friendly versions with school branding header

## 6. Activity Log Persistence
- The dashboard shows recent activity but the log isn't wired into all CRUD actions
- Hook every add/edit/delete across students, teachers, attendance, fees, results into the activity log

## 7. Print Branding
- All printable views (report cards, receipts, reports) need consistent school header with logo, name, motto, address

## 8. Forgot Password / Profile Settings
- Mock "Forgot Password" dialog still missing on login
- User profile/change password section in Settings

## 9. Notifications System
- Wire the notifications bell in TopBar to actually show unread alerts
- Auto-create notifications for: new payment, low attendance, upcoming events

## 10. Small Polish Items
- Loading skeletons across all pages
- Empty states with helpful illustrations
- Confirmation dialogs on destructive actions everywhere
- Keyboard shortcuts help dialog (Shift+?)

---

## Recommended Build Order

**Batch A — Wire up AI buttons** (highest user-visible value)
Results, Attendance, Fees, Timetable get their AI buttons.

**Batch B — Discipline + Library issue/return + Activity log everywhere**
Complete the modules that are half-done.

**Batch C — Notifications + Print branding + Forgot password + Polish**
Final professional polish across the system.

Files touched: `_app.results.tsx`, `_app.attendance.tsx`, `_app.fees.tsx`, `_app.timetable.tsx`, `_app.students.$studentId.tsx`, `_app.library.tsx`, `_app.communications.tsx`, `_app.reports.tsx`, `_app.notifications.tsx`, `_app.settings.tsx`, `index.tsx`, `TopBar.tsx`, `FeeReceipt.tsx`, `ReportCard.tsx`, `lib/storage.ts`.

No new dependencies needed. No backend changes.
