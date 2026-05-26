# 🏫 MPSMS — Mujahideen Preparatory School Management System
### 📍 Mankessim, Central Region, Ghana | ESTD 1997

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-First-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

Welcome to the official repository of **MPSMS (Mujahideen Preparatory School Management System)**. This is a premium, state-of-the-art Progressive Web App (PWA) designed to manage every facet of school operations—from student admissions and attendance tracking to automated weekly timetables, financial fee systems, AI-powered examination creation, and parent-student portals.

**🌐 Live System Demo**: [https://mujahideenprep.vercel.app](https://mujahideenprep.vercel.app)

---

## 📸 Key Features

### 📅 Weekly Landscape Timetables & Timeframes
- **Standard Printing**: Beautiful, landscape-oriented Weekly A4 Timetable layout containing institutional branding details.
- **Period Timeframes**: Period columns display standard period hours (e.g., *Period 1: 08:00 AM - 08:40 AM*).
- **Drag-and-Drop Editor**: Dynamic scheduling interface for administrators to drag/drop slots with conflict alert warnings.
- **Isolated Parent/Student Views**: Clean, read-only timetables restricted *only* to their respective children's classes.

### 📝 AI Exam Creator
- **GES Standard Exams**: AI-powered exam generator streaming official exam papers detailing indexes, instructions, and subject headers conforming to West African standards.
- **Source Options Toggle**: Toggle between generating new exams from **Syllabus Topics** or pasting and **Enhancing Draft Questions**.
- **Document Questions Uploader**: Automatically parse and import raw draft questions from local `.txt` document uploads straight into the drafts processor.
- **Diagram Sketchpad Canvas**: Inline geometric diagram canvas sketchpad drawing pad. Create diagrams and insert them as clean base64 PNGs.
- **Exporting Options**: Download exams as Plain Text (`.txt`) or fully styled Microsoft Word Documents (`.doc`).
- **Mobile Responsive Layout**: Toolbar labels fold into compact, space-efficient icons on mobile viewports.

### 🎙️ Persistent AI Assistant & Speech-to-Text
- **Voice Transcription**: Built-in transcription microphone using standard Web Speech `SpeechRecognition` API. Flogs red when listening and appends transcribed audio text straight to your text box.
- **Message History Persistence**: Keep your context active across page reloads by automatically storing message streams to `localStorage` caches.

### 📈 Attendance & grading reports
- **Interactive Daily Logging**: Easy checkmarks to register Student status (Present, Absent, Late). Updates child data instantly.
- **GES Standard Gradebook**: Automated letter grading and class rankings computed from class assessment weights (40%) and terminal exams (60%).
- **PDF Report Cards**: Generate and print elegant school reports with custom teacher remarks and principal signatures.

### 💰 Fees & Expense Ledger
- **Wallet MOMO Payments**: Built-in Mobile Money mock wallet system allowing parents to verify and pay fees instantly.
- **PDF Payment Receipts**: Instant printable transaction receipts detailing balances and tuition structures.
- **Operational Ledger**: Add category expenses (Salaries, Utility, Resets) to keep cash flow charts accurate.

---

## 🛠️ Technology Stack

- **Frontend Core**: [React 19](https://react.dev) & [Vite](https://vite.dev) (for high-speed production bundling)
- **Programming Language**: [TypeScript](https://typescriptlang.org) (fully typed codebases with zero compile errors)
- **Routing Engine**: [TanStack Router](https://tanstack.com/router) (type-safe file-system routing)
- **Styling system**: [Tailwind CSS v4](https://tailwindcss.com) (Vanilla utilities & custom harmonious design tokens)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL database, real-time caches, and secure user auth)
- **Artificial Intelligence**: [Google Gemini Pro Streaming API](https://ai.google.dev) (intelligent exam and comment generation)
- **Voice Technology**: [Web Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)

---

## 🗄️ Database Structure (Supabase PostgreSQL)

The backend utilizes PostgreSQL tables managed securely via Supabase. Below is a breakdown of the key tables:

- **`profiles`**: School profiles storing user records, emails, and full names.
- **`user_roles`**: Restricts layouts and navigations based on designated roles (`admin`, `teacher`, `parent`).
- **`students`**: Central register storing student details, classes, and current statuses.
- **`parent_students`**: Junction table linking parents' account profiles to their registered children.
- **`parent_students`**: Mapping of parent profile IDs to their children's student IDs.

---

## 🚀 Installation & Local Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org) (v18.0 or higher)
- [npm](https://npmjs.com) or [Bun](https://bun.sh) package manager

### 2. Clone the Repository
```bash
git clone https://github.com/DISCIPLINE55/mujahideenprep.git
cd mujahideenprep
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment Variables
Create a `.env` file in the root directory and specify your Supabase and Gemini keys:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-google-gemini-api-key
```

### 5. Running the App locally
To start the high-speed Vite development server:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

### 6. Verify Production Compilation
Run the local compiler checks and production builder to verify the workspace is 100% clean:
```bash
npm run build
```

---

## ☁️ Deployment on Vercel

This repository contains a pre-configured `vercel.json` file. To deploy the system live to Vercel:

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com), click **"Add New Project"**, and import your GitHub repository.
3. In the Environment Variables section, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. Click **Deploy**. Vercel will automatically build the project (`npm run build`) and host it live on your custom `.vercel.app` domain.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

Developed for **Mujahideen Preparatory School** — Mankessim, Central Region, Ghana. 🇬🇭
