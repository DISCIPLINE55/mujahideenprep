import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { getAuthSync } from "@/lib/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  Wallet,
  FileText,
  MessageSquare,
  ClipboardCheck,
  Sparkles,
  CalendarDays,
  Download,
  HelpCircle,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Info,
  Smartphone,
  Laptop,
} from "lucide-react";

export const Route = createFileRoute("/_app/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial & Help — MPSMS" },
      { name: "description", content: "Learn how to use Mujahideen Preparatory School Management System" },
    ],
  }),
  component: TutorialPage,
});

function TutorialPage() {
  const auth = getAuthSync();
  const userRole = auth?.role || "teacher";

  // Default to admin tab for admins, teacher tab for teachers
  const defaultTab = userRole === "admin" ? "admin" : "teacher";

  return (
    <>
      <TopBar title="Help & Tutorial" />
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Help & Tutorial Center</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Welcome to the MPSMS Interactive Portal. Follow these step-by-step instructions to get the most out of the system.
          </p>
        </div>

        {/* Tab Selector */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl mb-8">
            {userRole === "admin" && (
              <TabsTrigger value="admin" className="gap-2">
                <Users className="h-4 w-4" /> Admin Manual
              </TabsTrigger>
            )}
            <TabsTrigger value="teacher" className="gap-2">
              <GraduationCap className="h-4 w-4" /> Teacher Manual
            </TabsTrigger>
            <TabsTrigger value="pwa" className="gap-2">
              <Download className="h-4 w-4" /> App Installation
            </TabsTrigger>
          </TabsList>

          {/* ================= ADMIN TAB ================= */}
          {userRole === "admin" && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="border border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-primary/20 text-primary border-none">Administrator Role</Badge>
                  </div>
                  <CardTitle className="text-2xl mt-2">Core Administrative Workflows</CardTitle>
                  <CardDescription>
                    Guides and checklists for managing students, teachers, finances, and terminal results.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {/* Admin - Onboarding Students */}
                <AccordionItem value="admin-students" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Onboarding New Students</h3>
                        <p className="text-sm text-muted-foreground font-normal">How to register students and link parent profiles</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-4">
                    <ol className="space-y-3 pl-4 list-decimal text-muted-foreground">
                      <li>Navigate to the <span className="font-semibold text-foreground">Students</span> page using the left sidebar.</li>
                      <li>Click the <span className="font-semibold text-foreground">Add Student</span> button at the top-right of the page.</li>
                      <li>
                        Fill in the student's personal details:
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Full name, Date of Birth, Gender</li>
                          <li>Current class enrollment (e.g. Primary 4, JHS 1)</li>
                        </ul>
                      </li>
                      <li>
                        Enter the parent or guardian's <span className="font-semibold text-foreground">Phone Number</span>. 
                        This acts as their portal login ID and automatically links the child.
                      </li>
                      <li>Click <span className="font-semibold text-foreground">Save Student</span>.</li>
                    </ol>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 flex gap-3 text-sm mt-4">
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
                      <p>
                        <strong>Note:</strong> When you register a parent's phone number, the system automatically checks if a parent account already exists. If not, it provisions a new user record.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Admin - Teacher Invitations */}
                <AccordionItem value="admin-teachers" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Inviting Teachers & Staff</h3>
                        <p className="text-sm text-muted-foreground font-normal">Onboarding teachers and generating secure access codes</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-4">
                    <ol className="space-y-3 pl-4 list-decimal text-muted-foreground">
                      <li>Go to the <span className="font-semibold text-foreground">Teachers</span> portal from the sidebar.</li>
                      <li>Click <span className="font-semibold text-foreground">Add Teacher</span>.</li>
                      <li>Input their name, email/phone, and designate the subjects they teach.</li>
                      <li>After saving, click the teacher's profile row in the list to reveal their **Secure Invite Link** or invite code.</li>
                      <li>Copy the invite link and send it directly to the teacher. When they open it, they can register their account credentials securely.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* Admin - Financials */}
                <AccordionItem value="admin-fees" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Billing Fees & Recording Payments</h3>
                        <p className="text-sm text-muted-foreground font-normal">Setting term tuition and printing invoice receipts</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-4">
                    <ol className="space-y-3 pl-4 list-decimal text-muted-foreground">
                      <li>
                        <strong>Set Base Fees:</strong> Go to <span className="font-semibold text-foreground">Fees -&gt; Fee Settings</span>. Set the term fees per class.
                      </li>
                      <li>
                        <strong>Record Payment:</strong> Go to <span className="font-semibold text-foreground">Fees</span> and click <span className="font-semibold text-foreground">Record Payment</span>.
                      </li>
                      <li>Select the student, enter the paid amount, payment method (Cash, MoMo, Bank), and current date.</li>
                      <li>Click **Submit**. The system calculates the new outstanding balance instantly.</li>
                      <li>Click the **Print Receipt** icon next to the transaction. It opens a customized PDF receipt ready for printer outputs or download.</li>
                    </ol>
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex gap-3 text-sm">
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
                      <p>
                        <strong>Pro Tip:</strong> Click the <span className="font-semibold">Expenses</span> tab to log operating costs (salaries, utilities). The Admin Dashboard automatically subtracts total expenses from fee collections to show net monthly profit.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Admin - Gradebook Results */}
                <AccordionItem value="admin-results" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Publishing Exam Results</h3>
                        <p className="text-sm text-muted-foreground font-normal">Tracking performance and printing final report cards</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-4">
                    <ol className="space-y-3 pl-4 list-decimal text-muted-foreground">
                      <li>Go to the <span className="font-semibold text-foreground">Results</span> tab.</li>
                      <li>Select class, term, and subject to review or edit grades entered by teachers.</li>
                      <li>To print report cards: Click the **Report Cards** tab.</li>
                      <li>Select the class and term. You'll see a roster list of all students with their average grades.</li>
                      <li>Click **Print Report Card** next to a student. It compiles a gorgeous PDF containing academic grids, attendance tallies, teacher comments, and headmaster signature blocks.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* Admin - Broadcasts & WhatsApp */}
                <AccordionItem value="admin-comm" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Broadcasting Announcements & Reminders</h3>
                        <p className="text-sm text-muted-foreground font-normal">Sending internal announcements and bulk WhatsApp fee updates</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-foreground mb-1">Standard Announcements:</h4>
                        <ol className="space-y-2 pl-4 list-decimal text-muted-foreground">
                          <li>Click <span className="font-semibold text-foreground">Communications</span> inside the sidebar.</li>
                          <li>Click <span className="font-semibold text-foreground">New Announcement</span>.</li>
                          <li>Select target audience (All Parents, Teachers, or a specific class).</li>
                          <li>Write your message and click **Send**. Recipients see it instantly on their dashboard feeds.</li>
                        </ol>
                      </div>
                      <hr className="border-border" />
                      <div>
                        <h4 className="font-bold text-foreground mb-1">Bulk WhatsApp Fee Reminders:</h4>
                        <ol className="space-y-2 pl-4 list-decimal text-muted-foreground">
                          <li>Go to <span className="font-semibold text-foreground">Fees</span> and filter the view to show students with "Unpaid/Pending" balances.</li>
                          <li>Click the **WhatsApp** icon next to a parent, or click **Bulk WhatsApp Reminders**.</li>
                          <li>A pre-compiled message containing the child's name, class, and pending balance amount is prepared. The browser opens WhatsApp Web/Desktop directly to transmit it instantly.</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          )}

          {/* ================= TEACHER TAB ================= */}
          <TabsContent value="teacher" className="space-y-6">
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-primary/20 text-primary border-none">Teacher Role</Badge>
                </div>
                <CardTitle className="text-2xl mt-2">Classroom Management Workflows</CardTitle>
                <CardDescription>
                  Step-by-step guides for marking student attendance, recording class grades, and generating remarks.
                </CardDescription>
              </CardHeader>
            </Card>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Teacher - Attendance */}
              <AccordionItem value="teacher-attendance" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">Marking Daily Attendance</h3>
                      <p className="text-sm text-muted-foreground font-normal">Logging daily student presence in under 1 minute</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ol className="space-y-3 pl-4 list-decimal text-muted-foreground">
                    <li>Select <span className="font-semibold text-foreground">Attendance</span> in the sidebar.</li>
                    <li>Choose your class (e.g., Nursery, Primary 5) and the calendar date.</li>
                    <li>The roster list will load. Mark each student as:
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li><span className="text-emerald-500 font-medium">Present</span> (checked by default)</li>
                        <li><span className="text-rose-500 font-medium">Absent</span> (uncheck the box)</li>
                        <li><span className="text-amber-500 font-medium">Late</span></li>
                      </ul>
                    </li>
                    <li>Click <span className="font-semibold text-foreground">Save Attendance</span> at the bottom.</li>
                  </ol>
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>
                      <strong>Live Updates:</strong> Parents logging into their dashboard can instantly view their child's daily attendance records in real time.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Teacher - Entering Grades */}
              <AccordionItem value="teacher-grades" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">Recording Subject Grades</h3>
                      <p className="text-sm text-muted-foreground font-normal">Inputting Class Assessments (40%) and Terminal Exams (60%)</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ol className="space-y-3 pl-4 list-decimal text-muted-foreground">
                    <li>Go to the <span className="font-semibold text-foreground">Results</span> page in the sidebar.</li>
                    <li>Select the target **Class**, the **Subject** you teach, and the **Term**.</li>
                    <li>
                      Input the marks:
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>**Class Assessment**: Total of homework, quizzes, and classwork (max 100, which the system automatically weighs to 40%).</li>
                        <li>**Terminal Exam**: Final examination score (max 100, weighed to 60%).</li>
                      </ul>
                    </li>
                    <li>Click <span className="font-semibold text-foreground">Save Results</span>. The system automatically computes final marks, ranks, and letter grades.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              {/* Teacher - AI Assistant */}
              <AccordionItem value="teacher-ai" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow transition-shadow">
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">Generating AI Report Remarks</h3>
                      <p className="text-sm text-muted-foreground font-normal">Writing fast, professional comments with Gemini AI</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ol className="space-y-3 pl-4 list-decimal text-muted-foreground">
                    <li>Open the <span className="font-semibold text-foreground">AI Assistant</span> page from the sidebar.</li>
                    <li>Set the assistant mode to **Report Card Comment**.</li>
                    <li>Enter the student's name, overall performance indicators, and any notes (e.g., "strives to learn, but easily distracted").</li>
                    <li>Click **Generate**. The assistant uses Google Gemini to write a warm, encouraging, British English comment in seconds.</li>
                    <li>Copy and paste the comment directly into the student's report card remarks field!</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* ================= PWA APP TAB ================= */}
          <TabsContent value="pwa" className="space-y-6">
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-primary/20 text-primary border-none">Cross Platform App</Badge>
                </div>
                <CardTitle className="text-2xl mt-2">Installing PWA on Mobile & PC</CardTitle>
                <CardDescription>
                  Install the portal as an application on your home screen or desktop taskbar for fast access.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile Install */}
              <Card className="border border-border">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Smartphone className="h-5 w-5" />
                    <CardTitle className="text-lg">Mobile (Android & iOS)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-bold text-foreground mb-1">On Android (Chrome):</h4>
                    <p className="mb-2">A prompt will automatically appear at the bottom asking you to install the app. If not, tap the <strong>"Install App"</strong> button inside the sidebar footer.</p>
                  </div>
                  <hr className="border-border" />
                  <div>
                    <h4 className="font-bold text-foreground mb-1">On iPhone & iPad (Safari):</h4>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Open the website in Safari.</li>
                      <li>Tap the <strong>Share</strong> button (box with an upward arrow) in the toolbar.</li>
                      <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                      <li>Tap <strong>Add</strong> at the top right to complete.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Install */}
              <Card className="border border-border">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Laptop className="h-5 w-5" />
                    <CardTitle className="text-lg">Desktop (Windows, macOS, Linux)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Using Google Chrome or MS Edge:</h4>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Open the website.</li>
                      <li>In the URL bar, click the <strong>Install</strong> icon (looks like three desktop windows with a plus symbol) at the far right.</li>
                      <li>Alternatively, scroll to the bottom of the sidebar navigation and click the <strong>"Install App"</strong> action.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
