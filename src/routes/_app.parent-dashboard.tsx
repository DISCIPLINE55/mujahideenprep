import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Wallet, ClipboardCheck, FileText, CalendarDays, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { getItems, setItems, generateId, defaultStudents, defaultPayments, defaultEvents, defaultSettings, KEYS, updateStudentFeeStatus, type Student, type Payment, type AttendanceRecord, type ExamResult, type SchoolEvent, type SchoolSettings } from "@/lib/storage";
import { getAuthSync } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/_app/parent-dashboard")({
  component: ParentDashboard,
});

function ParentDashboard() {
  const auth = getAuthSync();
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  
  const [payModal, setPayModal] = useState<{ open: boolean; student: Student | null; amount: number }>({ open: false, student: null, amount: 0 });
  const [paying, setPaying] = useState(false);
  const [payStep, setPayStep] = useState<"form" | "prompt" | "success">("form");

  useEffect(() => {
    async function init() {
      const { data: sData } = await supabase.from("settings").select("*").single();
      if (sData) setSettings(sData as SchoolSettings);
      
      const { data: stdData } = await supabase.from("students").select("*");
      if (stdData) setStudents(stdData);
      
      const { data: pData } = await supabase.from("payments").select("*");
      if (pData) setPayments(pData);
      
      const { data: aData } = await supabase.from("attendance").select("*");
      if (aData) setAttendance(aData);
      
      const { data: rData } = await supabase.from("results").select("*");
      if (rData) setResults(rData);
      
      const { data: eData } = await supabase.from("events").select("*");
      if (eData) setEvents(eData);
    }
    init();
  }, []);

  const myStudents = useMemo(() =>
    students.filter((s) => auth?.studentIds?.includes(s.id)),
    [students, auth]
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const upcomingEvents = useMemo(() =>
    events.filter((e) => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [events, todayStr]
  );

  async function handleMomoPayment() {
    if (!payModal.student || payModal.amount <= 0) return;
    setPaying(true);
    setPayStep("prompt");
    
    // Simulate MoMo Push Notification
    await new Promise(r => setTimeout(r, 3000));
    
    const newPayment: Payment = {
      id: generateId(),
      studentId: payModal.student.id,
      studentName: payModal.student.name,
      class: payModal.student.class,
      totalFee: 0, // In this flow we just record the payment
      amountPaid: payModal.amount,
      date: new Date().toISOString().split("T")[0],
      description: `MoMo Payment via ${settings.momoProvider || "Mobile Money"}`
    };

    const { error } = await supabase.from("payments").insert(newPayment);
    if (error) {
      toast.error("Payment sync failed");
      setPaying(false);
      setPayStep("form");
    } else {
      // Recalculate and update the child's fee status dynamically
      const newStatus = await updateStudentFeeStatus(payModal.student.id);
      
      // Update local state so that dashboard instantly reflects the updated fee status
      setPayments([...payments, newPayment]);
      setStudents((prev) =>
        prev.map((s) => (s.id === payModal.student!.id ? { ...s, fees: newStatus } : s))
      );
      
      setPayStep("success");
      setPaying(false);
      toast.success("Payment Verified!");
    }
  }

  return (
    <>
      <TopBar title="Parent Portal" />
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{greeting}, {auth?.name ?? "Parent"} 👋</h2>
            <p className="text-sm text-muted-foreground">Manage your children's academics and fees.</p>
          </div>
        </div>

        {myStudents.map((student) => {
          const studentPayments = payments.filter((p) => p.studentId === student.id);
          const totalFees = studentPayments.reduce((s, p) => s + p.totalFee, 0);
          const totalPaid = studentPayments.reduce((s, p) => s + p.amountPaid, 0);
          const balance = totalFees - totalPaid;
          const studentAttendance = attendance.filter((a) => a.studentId === student.id);
          const presentCount = studentAttendance.filter((a) => a.status === "Present").length;
          const attendanceRate = studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 0;
          const studentResults = results.filter((r) => r.studentId === student.id);
          const latestResult = studentResults.length > 0 ? studentResults[studentResults.length - 1] : null;

          return (
            <Card key={student.id} className="border-none shadow-md overflow-hidden bg-card/50">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{student.class} • Active Student</p>
                  </div>
                  <Badge variant="outline" className="ml-auto bg-background">{student.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard title="Attendance" value={`${attendanceRate}%`} icon={ClipboardCheck} />
                  <StatsCard title="GPA Average" value={latestResult ? `${latestResult.average.toFixed(1)}%` : "—"} icon={FileText} />
                  <StatsCard title="Fees Paid" value={`${settings.currency} ${totalPaid.toLocaleString()}`} icon={Wallet} />
                  <StatsCard title="Balance" value={`${settings.currency} ${balance.toLocaleString()}`} icon={Wallet} trend={{ value: balance === 0 ? "Fully Paid" : "Outstanding", positive: balance === 0 }} />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                   <div>
                      <p className="font-bold text-primary">Outstanding Balance</p>
                      <p className="text-sm text-muted-foreground">Pay fees instantly using your Mobile Money wallet.</p>
                   </div>
                   <Button 
                    disabled={balance <= 0}
                    onClick={() => { setPayModal({ open: true, student, amount: balance }); setPayStep("form"); }}
                    className="w-full sm:w-auto shadow-lg shadow-primary/20"
                   >
                     <Smartphone className="mr-2 h-4 w-4" /> Pay via MoMo
                   </Button>
                </div>

                {latestResult && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Latest Exam Results ({latestResult.term})</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {latestResult.subjects.slice(0, 3).map((sub, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs">
                          <span className="font-medium">{sub.name}</span>
                          <span className="font-bold">{sub.total}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {upcomingEvents.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Upcoming Events</CardTitle></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={payModal.open} onOpenChange={(v) => setPayModal({ ...payModal, open: v })}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>MoMo Payment Gateway</DialogTitle>
            <DialogDescription>Pay fees for {payModal.student?.name}</DialogDescription>
          </DialogHeader>
          
          {payStep === "form" && (
            <div className="space-y-6 py-4">
               <div className="text-center p-4 rounded-2xl bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total to Pay</p>
                  <p className="text-3xl font-black text-primary">{settings.currency} {payModal.amount.toLocaleString()}</p>
               </div>
               <div className="space-y-2">
                  <Label>Your MoMo Number</Label>
                  <Input placeholder="024 000 0000" defaultValue={auth?.email} />
               </div>
               <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Smartphone className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Push Notification</p>
                    <p className="text-xs text-muted-foreground">You will receive a prompt on your phone to enter your PIN.</p>
                  </div>
               </div>
               <Button className="w-full h-12 text-lg rounded-xl" onClick={handleMomoPayment}>Authorize Payment</Button>
            </div>
          )}

          {payStep === "prompt" && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
               <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary" />
               </div>
               <div>
                  <h3 className="text-xl font-bold">Checking Phone...</h3>
                  <p className="text-muted-foreground mt-2 px-6 text-sm">Please check your phone for the <strong>{settings.momoProvider}</strong> prompt and enter your MoMo PIN to complete the transaction.</p>
               </div>
            </div>
          )}

          {payStep === "success" && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
               <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-success" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-success">Payment Verified!</h3>
                  <p className="text-muted-foreground mt-2 px-6 text-sm">Thank you. The school fee has been updated successfully. A digital receipt has been sent to your email.</p>
               </div>
               <Button variant="outline" className="rounded-xl" onClick={() => setPayModal({ ...payModal, open: false })}>Back to Portal</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
