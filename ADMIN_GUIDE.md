# MPSMS — Admin User Guide
### Mujahideen Preparatory School Management System (Mankessim, Ghana)

Welcome to the **Mujahideen Preparatory School Management System (MPSMS)**. This system is designed to streamline administrative tasks, student enrollment, teacher tracking, attendance logging, academic grading, financial transactions, and school-wide communications.

---

## Table of Contents
1. [Getting Started & Installation](#1-getting-started--installation)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Student Management](#3-student-management)
4. [Teacher & Staff Management](#4-teacher--staff-management)
5. [Class & Subject Administration](#5-class--subject-administration)
6. [Academics, Marks & Report Cards](#6-academics-marks--report-cards)
7. [Financial Management (Fees & Expenses)](#7-financial-management-fees--expenses)
8. [Timetables & Attendance](#8-timetables--attendance)
9. [Communications & Bulk WhatsApp](#9-communications--bulk-whatsapp)
10. [Using the AI School Assistant](#10-using-the-ai-school-assistant)

---

## 1. Getting Started & Installation

### Accessing the Portal
1. Open your web browser (Chrome, Edge, or Safari) and go to: **[https://mujahideenprep.vercel.app](https://mujahideenprep.vercel.app)**
2. Log in using your Administrator credentials.

### Mobile & Desktop App Installation (PWA)
MPSMS is a Progressive Web App (PWA), meaning you can install it as a native app on your phone, tablet, or computer:
* **On Desktop (Chrome/Edge)**: Click the **"Install App"** button at the bottom of the sidebar navigation or click the install icon in the URL bar.
* **On Android**: A prompt will pop up after 3 seconds asking you to install the app. Alternatively, tap the **"Install App"** button in the sidebar.
* **On iOS (iPhone/iPad)**: Open the portal in Safari, tap the **Share** button (box with an upward arrow), scroll down, and select **"Add to Home Screen"**.

---

## 2. Dashboard Overview
Upon logging in, the Admin sees the school's central telemetry:
* **Total Students & Teachers**: Live counts of enrolled individuals.
* **Attendance Rate**: Today's attendance percentage.
* **Monthly Financial Balance**: Real-time summary comparing fee collection against operational expenses.
* **Quick Actions**: Shortcuts to enroll a student, record a payment, or draft an announcement.

---

## 3. Student Management
The **Students** tab (`/students`) allows managing the student body.

### How to Register/Onboard a New Student:
1. Click **Students** in the sidebar, then click **Add Student** at the top right.
2. Fill out the student's profile:
   * **Full Name, Date of Birth, Gender**.
   * **Assigned Class** (e.g., Primary 3, JHS 1).
   * **Parent/Guardian Information** (Name, Phone Number, Email, and Relationship).
3. Click **Save**. The student is now registered and will automatically be included in attendance logs, gradebooks, and fee billing rosters.

### Link Parent Accounts:
* Every student registration automatically maps to a parent record using the provided guardian phone number. Parents can log in with their phone number to check their child's attendance, grades, and fee balances.

---

## 4. Teacher & Staff Management
The **Teachers** tab (`/teachers`) is used to manage educators.

### How to Onboard a Teacher:
1. Click **Teachers** in the sidebar, then select **Add Teacher**.
2. Input their details (Name, Contact Info, Qualification, and Date of Hire).
3. **Assigned Subjects**: Choose the subjects they teach.
4. **Invite Code**: The system generates a secure link or invite code. Send this code to the teacher so they can set up their secure login.

---

## 5. Class & Subject Administration
The **Classes** tab (`/classes`) manages the academic layout of the school.

* **Academic Levels**: Creche, Nursery, KG 1-2, Primary 1-6, and JHS 1-3.
* **Adding Subjects**: Under **Subjects**, configure school courses (e.g., Mathematics, English, Integrated Science, Ghanaian Language, Creative Arts). Assign subjects to classes and designate teaching staff.

---

## 6. Academics, Marks & Report Cards
The **Results** tab (`/results`) houses the school's gradebook.

### How to Record Student Marks:
1. Select the **Class**, **Term**, and **Subject**.
2. Input scores for:
   * **Class Assessment** (40% weight).
   * **Terminal Exam** (60% weight).
3. The system automatically computes the total score, assigns a letter grade (based on the Ghana Education Service standard), and calculates the class rank.

### Generating & Exporting Report Cards:
1. Go to **Results** -> **Report Cards**.
2. Select a class and term.
3. Click **Print Report Card** to save/print a beautifully formatted PDF report containing academic grades, teacher remarks, attendance summaries, and principal signatures.

---

## 7. Financial Management (Fees & Expenses)
Manage payments and expenses in the **Fees** (`/fees`) and **Expenses** (`/expenses`) tabs.

### Setting Up Term Fees:
1. Go to **Fees** -> **Fee Settings**.
2. Define the base tuition and auxiliary fees (e.g., PTA, computer lab, feeding) for each class level.

### Recording a Payment:
1. Select **Fees** -> **Record Payment**.
2. Search for the student by name.
3. Input the amount paid (supports partial payments) and the payment method (Cash, MoMo, Bank Transfer).
4. Click **Submit** to instantly generate an official, printable **PDF Payment Receipt** containing receipt number, student name, class, amount paid, and outstanding balance.

### Tracking Expenses:
1. Go to **Expenses** -> **Add Expense**.
2. Input the category (e.g., Staff Salaries, Utility Bills, Maintenance, Stationeries), amount, date, and attach a digital receipt.
3. The dashboard aggregates this data to display the net cash flow.

---

## 8. Timetables & Attendance

### Daily Attendance
1. Click **Attendance** (`/attendance`).
2. Select the class and date.
3. Check the box for **Present**, **Absent**, or **Late** for each student.
4. Click **Save Attendance**. Parents will instantly see their child's attendance updated in their parent portal.

### Weekly Timetables
1. Go to **Timetable** (`/timetable`).
2. Visual grids display schedules for each class.
3. Click **Edit Timetable** to assign teachers and subjects to specific time slots. The system alerts you if there are teacher schedule overlaps.

---

## 9. Communications & Bulk WhatsApp
Under the **Communications** (`/communications`) tab, keep parents and teachers aligned.

### Sending Broadcast Announcements:
1. Click **New Announcement**.
2. Choose the recipient group: **All Parents**, **All Teachers**, or a **Specific Class**.
3. Type the message and click **Send**. The announcement will appear in their login dashboard notifications feed.

### Triggering Bulk WhatsApp Reminders:
To remind parents about outstanding fees:
1. Select **Fees** -> **Payment Reminders**.
2. Filter for students with outstanding balances.
3. Click **Send WhatsApp Reminders**. The system integrates with WhatsApp to open pre-filled messages detailing the exact balance and payment instructions.

---

## 10. Using the AI School Assistant
MPSMS features an advanced, built-in **AI Assistant** (`/ai-assistant`) powered by Google Gemini to help administrators automate repetitive writing tasks.

### Practical Admin Use Cases:
* **Writing Report Comments**: Select a student with poor performance and prompt the assistant: *"Write an encouraging but firm report card comment for Kwesi, who is struggling in Math but excels in Creative Arts."*
* **Attendance Analysis**: Feed attendance data to the AI to identify students showing warning signs of dropping out.
* **Drafting Communication Letters**: Ask the assistant: *"Draft a polite letter to parents explaining the rescheduled PTA meeting for June 15th."*
* **Schedule Optimizations**: Ask: *"I have 3 teachers for JHS 1-3 math. Suggest an optimal block scheduling timetable."*

---

### Need Help?
For technical support or feature requests, contact the system administrator or submit an issue via the school registry portal.
