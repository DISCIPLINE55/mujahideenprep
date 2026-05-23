import { useState, useRef, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Save, Download, Upload, Lock, School, Calendar, Palette, Database, 
  CheckCircle, Trash2, GraduationCap, MessageSquare, Sparkles, Activity, 
  Shield, Key, Settings, UserPlus, ArrowUpCircle, Smartphone, Wallet, User, Users
} from "lucide-react";
import { KEYS, defaultSettings, CLASS_LIST, setItems, getItems, defaultStudents, defaultTeachers, defaultClasses, generateId, type SchoolSettings, type Student, type FeeStructure, type Teacher, type SchoolClass, exportAllData, importAllData } from "@/lib/storage";
import { getAuthSync } from "@/lib/auth";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MPSMS" },
      { name: "description", content: "School settings and configuration for Mujahideen Preparatory School" },
      { property: "og:title", content: "School Settings — MPSMS" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const auth = getAuthSync();
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [logSearch, setLogSearch] = useState("");

  const teacherStore = useStore<Teacher>(KEYS.TEACHERS, defaultTeachers);
  const studentStore = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const classStore = useStore<SchoolClass>(KEYS.CLASSES, defaultClasses);

  const role = auth?.role?.toLowerCase();

  // Teacher settings states
  const teacher = useMemo(() => teacherStore.items.find(t => t.id === auth?.teacherId), [teacherStore.items, auth]);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({});

  useEffect(() => {
    if (teacher) {
      setTeacherForm({
        email: teacher.email || "",
        phone: teacher.phone || "",
        specialization: teacher.specialization || "",
        qualification: teacher.qualification || "",
        bankName: teacher.bankName || "",
        accountNumber: teacher.accountNumber || "",
        emergencyContact: teacher.emergencyContact || "",
        bloodGroup: teacher.bloodGroup || "",
      });
    }
  }, [teacher]);

  const assignedClassNames = useMemo(() => {
    if (!teacher) return [];
    const profileClasses = teacher.classes 
      ? teacher.classes.split(",").map(s => s.trim()).filter(Boolean) 
      : [];
    const tableClasses = classStore.items
      .filter((c) => c.teacher === teacher.name)
      .map((c) => c.name);
    return Array.from(new Set([...profileClasses, ...tableClasses]));
  }, [teacher, classStore.items]);

  async function handleUpdateTeacherProfile() {
    if (!teacher) return;
    const loader = toast.loading("Updating profile...");
    try {
      const updated = {
        ...teacher,
        ...teacherForm,
      } as Teacher;
      await teacherStore.update(updated);
      toast.success("Profile details updated successfully!", { id: loader });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile", { id: loader });
    }
  }

  // Parent settings states
  const myStudents = useMemo(() =>
    studentStore.items.filter((s) => auth?.studentIds?.includes(s.id)),
    [studentStore.items, auth]
  );
  const [parentName, setParentName] = useState(auth?.name || "");

  async function handleUpdateParentProfile() {
    const loader = toast.loading("Updating parent profile...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("No session found");

      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: parentName }
      });
      if (authErr) throw authErr;

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ full_name: parentName })
        .eq("id", session.user.id);
      if (profileErr) throw profileErr;

      const currentAuth = getAuthSync();
      if (currentAuth) {
        currentAuth.name = parentName;
        localStorage.setItem("mpsms_auth_meta", JSON.stringify(currentAuth));
        window.dispatchEvent(new Event("storage"));
      }

      toast.success("Profile updated successfully!", { id: loader });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile", { id: loader });
    }
  }


  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      (log.action || "").toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.user_name || "").toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.user_role || "").toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [logs, logSearch]);

  useEffect(() => {
    async function init() {
      try {
        const { data, error } = await supabase.from("settings").select("*").single();
        if (data) {
          setSettings(data as SchoolSettings);
        }
        
        // Fetch fee structures
        const { data: structs } = await supabase.from("fee_structure").select("*");
        if (structs) setFeeStructures(structs);

        // Fetch activity logs
        const { data: logData } = await supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }).limit(100);
        if (logData) setLogs(logData);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleSave() {
    const loader = toast.loading("Saving configuration...");
    try {
      const { error } = await supabase.from("settings").upsert({
        ...settings,
        id: (settings as any).id || "school_settings_1"
      });
      if (error) throw error;
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      toast.success("All settings synced to cloud", { id: loader });
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`, { id: loader });
    }
  }

  async function handleChangePassword() {
    if (!pwd.next || pwd.next !== pwd.confirm) { toast.error("Passwords do not match"); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setPwd({ current: "", next: "", confirm: "" }); }
  }

  function handleBackupDownload() {
    try {
      const dataStr = exportAllData();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `MPSMS_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Backup file downloaded successfully!");
    } catch (err: any) {
      toast.error(`Backup failed: ${err.message}`);
    }
  }

  function handleBackupUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const success = importAllData(text);
        if (success) {
          toast.success("Backup loaded into cache successfully! Syncing to cloud...");
          
          const keysToTables: Record<string, string> = {
            [KEYS.STUDENTS]: "students",
            [KEYS.TEACHERS]: "teachers",
            [KEYS.CLASSES]: "classes",
            [KEYS.SUBJECTS]: "subjects",
            [KEYS.RESULTS]: "results",
            [KEYS.PAYMENTS]: "payments",
            [KEYS.EXPENSES]: "expenses",
            [KEYS.ATTENDANCE]: "attendance",
            [KEYS.EVENTS]: "events",
            [KEYS.SETTINGS]: "settings",
            [KEYS.TIMETABLE]: "timetable",
            [KEYS.NOTIFICATIONS]: "notifications",
            [KEYS.BOOKS]: "library_books",
            [KEYS.ISSUES]: "library_issues",
            [KEYS.FEE_STRUCTURE]: "fee_structure",
            [KEYS.COMMUNICATIONS]: "communications",
          };
          
          const loader = toast.loading("Syncing restored backup to Supabase...");
          const { syncLocalToCloud } = await import("@/lib/db");
          const { synced, failed } = await syncLocalToCloud(keysToTables);
          if (failed.length > 0) {
            toast.warning(`Restored cached data. Failed to sync tables: ${failed.join(", ")}`, { id: loader });
          } else {
            toast.success("Backup successfully restored and synced to database!", { id: loader });
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          toast.error("Invalid backup file format.");
        }
      } catch (err: any) {
        toast.error(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const updateGrade = (index: number, field: string, value: any) => {
    const newScales = [...settings.gradingScales];
    newScales[index] = { ...newScales[index], [field]: value };
    setSettings({ ...settings, gradingScales: newScales });
  };

  const pageTitle = role === "admin" 
    ? "System Settings" 
    : role === "teacher" 
    ? "Teacher Settings & Profile" 
    : "Parent Settings & Profile";

  const pageSubtitle = role === "admin"
    ? "Manage school identity, academic rules, and system integrations."
    : role === "teacher"
    ? "View your professional record and update account details."
    : "View your student relationships and update account details.";

  const defaultTab = role === "admin" ? "identity" : "profile";

  if (loading) return <div className="flex items-center justify-center h-screen"><Sparkles className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      <TopBar title={role === "admin" ? "System Configuration" : "My Settings"} />
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
            <p className="text-muted-foreground">{pageSubtitle}</p>
          </div>
          {role === "admin" && (
            <Button onClick={handleSave} size="lg" className="shadow-lg">
              <Save className="mr-2 h-4 w-4" /> Save Configuration
            </Button>
          )}
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
            {role === "admin" ? (
              <>
                <TabsTrigger value="identity" className="rounded-lg py-2 px-4"><School className="h-4 w-4 mr-2" /> School Identity</TabsTrigger>
                <TabsTrigger value="academics" className="rounded-lg py-2 px-4"><GraduationCap className="h-4 w-4 mr-2" /> Academics</TabsTrigger>
                <TabsTrigger value="fees" className="rounded-lg py-2 px-4"><Wallet className="h-4 w-4 mr-2" /> Fees</TabsTrigger>
                <TabsTrigger value="system" className="rounded-lg py-2 px-4"><Settings className="h-4 w-4 mr-2" /> Integrations</TabsTrigger>
                <TabsTrigger value="security" className="rounded-lg py-2 px-4"><Shield className="h-4 w-4 mr-2" /> Security & Logs</TabsTrigger>
                <TabsTrigger value="danger" className="rounded-lg py-2 px-4 text-destructive"><Database className="h-4 w-4 mr-2" /> Danger Zone</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="profile" className="rounded-lg py-2 px-4"><User className="h-4 w-4 mr-2" /> My Profile</TabsTrigger>
                <TabsTrigger value="password" className="rounded-lg py-2 px-4"><Lock className="h-4 w-4 mr-2" /> Change Password</TabsTrigger>
              </>
            )}
          </TabsList>

          {role === "admin" && (
            <>
              <TabsContent value="identity" className="space-y-6">
                <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                         <img src={settings.logo || logoImg} alt="Logo" className="h-16 w-16 rounded-2xl shadow-inner border bg-background object-cover" />
                         <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="h-5 w-5 text-white" />
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const loader = toast.loading("Uploading logo...");
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `school-logo-${Date.now()}.${fileExt}`;
                                const { data, error } = await supabase.storage.from('school-assets').upload(fileName, file);
                                if (error) throw error;
                                
                                const { data: { publicUrl } } = supabase.storage.from('school-assets').getPublicUrl(fileName);
                                setSettings({ ...settings, logo: publicUrl });
                                toast.success("Logo uploaded!", { id: loader });
                              } catch (err: any) {
                                toast.error(`Upload failed: ${err.message}. Make sure 'school-assets' bucket exists in Supabase.`, { id: loader });
                              }
                            }} />
                         </div>
                      </div>
                      <div>
                        <CardTitle className="text-base">Branding & Info</CardTitle>
                        <p className="text-xs text-muted-foreground">This information appears on reports and receipts.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">School Name</Label>
                        <Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="bg-background/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Motto</Label>
                        <Input value={settings.motto} onChange={(e) => setSettings({ ...settings, motto: e.target.value })} className="bg-background/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Currency Code</Label>
                        <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })} placeholder="e.g. GHS" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Receipt Prefix</Label>
                        <Input value={settings.receiptPrefix} onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value.toUpperCase() })} placeholder="e.g. MPS-" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Location</Label>
                        <Input value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })} className="bg-background/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                        <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="bg-background/50" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="bg-background/50" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Address</Label>
                        <Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="bg-background/50" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="space-y-6">
                <Card className="border-none shadow-md bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Fee Structure</CardTitle>
                      <CardDescription>Set the base terminal fees for each class level.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => {
                       const loader = toast.loading("Applying fees to all students...");
                       try {
                         const { data: students } = await supabase.from("students").select("*");
                         const { data: structures } = await supabase.from("fee_structure").select("*");
                         if (!students || !structures) return;

                         const updates = students.map(s => {
                            const struct = structures.find(f => f.className === s.class);
                            return {
                               studentId: s.id,
                               studentName: s.name,
                               class: s.class,
                               totalFee: struct?.amount || 0,
                               amountPaid: 0,
                               date: new Date().toISOString().split("T")[0],
                               description: `Fees for ${settings.currentTerm}`
                            };
                         });
                         
                         await supabase.from("payments").upsert(updates);
                         toast.success("Fees applied successfully!", { id: loader });
                       } catch (err: any) {
                         toast.error(err.message, { id: loader });
                       }
                    }}>
                       <ArrowUpCircle className="h-4 w-4 mr-2" /> Apply to All Students
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-background/50 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left p-4 font-bold">Class Level</th>
                            <th className="text-left p-4 font-bold">Base Fee ({settings.currency})</th>
                            <th className="text-left p-4 font-bold">Description</th>
                            <th className="text-right p-4 font-bold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {CLASS_LIST.map((cls) => {
                            const struct = feeStructures.find(f => f.className === cls);
                            return (
                              <tr key={cls} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4 font-medium">{cls}</td>
                                <td className="p-4">
                                  <Input 
                                    type="number" 
                                    className="w-32 h-8" 
                                    defaultValue={struct?.amount || 0}
                                    onBlur={async (e) => {
                                       const val = parseFloat(e.target.value);
                                       const { error } = await supabase.from("fee_structure").upsert({
                                          id: struct?.id || generateId(),
                                          className: cls,
                                          amount: val,
                                          description: "Standard Tuition"
                                       });
                                       if (error) toast.error("Save failed");
                                       else {
                                          toast.success(`${cls} fee updated`);
                                          // Refresh local state
                                          setFeeStructures(prev => {
                                             const existing = prev.find(p => p.className === cls);
                                             if (existing) return prev.map(p => p.className === cls ? {...p, amount: val} : p);
                                             return [...prev, { id: generateId(), className: cls, amount: val, description: "Standard Tuition" }];
                                          });
                                       }
                                    }}
                                  />
                                </td>
                                <td className="p-4 text-muted-foreground text-xs">Standard terminal fee covering tuition and books.</td>
                                <td className="p-4 text-right">
                                   <Badge variant="outline" className="text-[10px]">Auto-Synced</Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="academics" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-md bg-card/50">
                    <CardHeader><CardTitle>Grading Weights</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Class Work (%)</Label>
                        <Input type="number" className="w-24" value={settings.classWorkWeight} onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setSettings({...settings, classWorkWeight: val, examWeight: 100 - val});
                        }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <Label>Examination (%)</Label>
                        <Input type="number" className="w-24" value={settings.examWeight} disabled />
                      </div>
                      <p className="text-xs text-muted-foreground italic">Weights must sum to 100%. Total scores will be auto-calculated.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md bg-card/50">
                    <CardHeader><CardTitle>Academic Term</CardTitle></CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Current Academic Year</Label>
                        <Input value={settings.academicYear} onChange={e => setSettings({...settings, academicYear: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Active Term</Label>
                        <Select value={settings.currentTerm} onValueChange={v => setSettings({...settings, currentTerm: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Term 1">Term 1</SelectItem>
                            <SelectItem value="Term 2">Term 2</SelectItem>
                            <SelectItem value="Term 3">Term 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-md bg-card/50">
                  <CardHeader><CardTitle>Grading Scale Configuration</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Grade</TableHead>
                          <TableHead>Min Score</TableHead>
                          <TableHead>Official Remark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settings.gradingScales.map((scale, i) => (
                          <TableRow key={i}>
                            <TableCell><Input className="h-8 w-16 font-bold" value={scale.grade} onChange={e => updateGrade(i, "grade", e.target.value)} /></TableCell>
                            <TableCell><Input type="number" className="h-8 w-20" value={scale.minScore} onChange={e => updateGrade(i, "minScore", parseInt(e.target.value) || 0)} /></TableCell>
                            <TableCell><Input className="h-8" value={scale.remark} onChange={e => updateGrade(i, "remark", e.target.value)} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="system" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-md bg-card/50">
                    <CardHeader><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /><CardTitle>WhatsApp Gateway</CardTitle></div></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>API Provider Key</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="sk-..." className="pl-10" value={settings.whatsappApiKey} onChange={e => setSettings({...settings, whatsappApiKey: e.target.value})} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Used for bulk reminders and parent communications.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md bg-card/50">
                    <CardHeader><div className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /><CardTitle>Mobile Money (MoMo)</CardTitle></div></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Merchant MoMo Number</Label>
                        <Input placeholder="e.g. 024XXXXXXX" value={settings.momoNumber} onChange={e => setSettings({...settings, momoNumber: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Network Provider</Label>
                        <Select value={settings.momoProvider} onValueChange={v => setSettings({...settings, momoProvider: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Provider" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                            <SelectItem value="Telecel">Telecel Cash</SelectItem>
                            <SelectItem value="AT">AT Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground italic">Parents will see this number when making payments.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="border-none shadow-md bg-card/50">
                  <CardHeader><div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><CardTitle>Update Password</CardTitle></div></CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3 items-end">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" value={pwd.next} onChange={e => setPwd({...pwd, next: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" value={pwd.confirm} onChange={e => setPwd({...pwd, confirm: e.target.value})} />
                    </div>
                    <Button variant="outline" onClick={handleChangePassword}>Update Account</Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-card/50">
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>System Activity Audit</CardTitle>
                        <CardDescription>Real-time audit log of system modifications and administrative events.</CardDescription>
                      </div>
                    </div>
                    <div className="w-full sm:w-64">
                      <Input 
                        placeholder="Search logs..." 
                        value={logSearch} 
                        onChange={e => setLogSearch(e.target.value)} 
                        className="h-9 bg-background/50"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-background/50 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="font-bold">Operator</TableHead>
                            <TableHead className="font-bold">Role</TableHead>
                            <TableHead className="font-bold">Action Taken</TableHead>
                            <TableHead className="font-bold text-right">Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.map((log, i) => (
                            <TableRow key={i} className="hover:bg-muted/25 transition-colors">
                              <TableCell className="font-medium">{log.user_name || "System"}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    log.user_role === "admin" 
                                      ? "default" 
                                      : log.user_role === "teacher" 
                                      ? "secondary" 
                                      : "outline"
                                  }
                                >
                                  {log.user_role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-foreground max-w-xs sm:max-w-md truncate" title={log.action}>
                                {log.action}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground text-xs font-mono">
                                {new Date(log.timestamp).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredLogs.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No matching audit logs found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="danger" className="space-y-6">
                 <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader><CardTitle className="text-destructive">High-Risk Operations</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between border-b border-destructive/10 pb-4">
                        <div>
                          <p className="font-bold">Sync All Data to Cloud</p>
                          <p className="text-xs text-muted-foreground">Upload all existing local records to Supabase.</p>
                        </div>
                        <Button variant="default" className="bg-primary" onClick={async () => {
                            const loader = toast.loading("Syncing all local data to cloud...");
                            try {
                              const keysToTables: Record<string, string> = {
                                [KEYS.STUDENTS]: "students",
                                [KEYS.TEACHERS]: "teachers",
                                [KEYS.CLASSES]: "classes",
                                [KEYS.SUBJECTS]: "subjects",
                                [KEYS.RESULTS]: "results",
                                [KEYS.PAYMENTS]: "payments",
                                [KEYS.EXPENSES]: "expenses",
                                [KEYS.ATTENDANCE]: "attendance",
                                [KEYS.EVENTS]: "events",
                                [KEYS.SETTINGS]: "settings",
                                [KEYS.TIMETABLE]: "timetable",
                                [KEYS.NOTIFICATIONS]: "notifications",
                                [KEYS.BOOKS]: "library_books",
                                [KEYS.ISSUES]: "library_issues",
                                [KEYS.FEE_STRUCTURE]: "fee_structure",
                                [KEYS.COMMUNICATIONS]: "communications",
                              };
                              const { syncLocalToCloud } = await import("@/lib/db");
                              const { synced, failed } = await syncLocalToCloud(keysToTables);
                              if (failed.length > 0) {
                                toast.warning(`Synced ${synced.length} tables. Failed: ${failed.join(", ")}`, { id: loader });
                              } else {
                                toast.success(`All ${synced.length} tables synced!`, { id: loader });
                              }
                            } catch (err: any) { toast.error(err.message, { id: loader }); }
                        }}>Run Cloud Sync</Button>
                      </div>

                      <div className="flex items-center justify-between border-b border-destructive/10 pb-4">
                        <div>
                          <p className="font-bold">System Backup (JSON)</p>
                          <p className="text-xs text-muted-foreground">Download a complete backup file containing all students, results, classes, and settings.</p>
                        </div>
                        <Button variant="outline" onClick={handleBackupDownload}>
                          <Download className="mr-2 h-4 w-4" /> Download Backup
                        </Button>
                      </div>

                      <div className="flex items-center justify-between border-b border-destructive/10 pb-4">
                        <div>
                          <p className="font-bold">System Restore (JSON)</p>
                          <p className="text-xs text-muted-foreground">Upload a previously saved JSON backup file to overwrite local cache and sync to cloud.</p>
                        </div>
                        <Button variant="outline" asChild>
                          <label className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" /> Upload & Restore
                            <input type="file" accept=".json" className="hidden" onChange={handleBackupUpload} />
                          </label>
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-destructive">Wipe All Local Cache</p>
                          <p className="text-xs text-muted-foreground">Clear browser memory. Database is not affected.</p>
                        </div>
                        <Button variant="destructive" onClick={() => {
                          if (confirm("Clear local memory?")) { localStorage.clear(); window.location.reload(); }
                        }}>Wipe Cache</Button>
                      </div>
                    </CardContent>
                 </Card>
              </TabsContent>
            </>
          )}

          {role === "teacher" && (
            <>
              <TabsContent value="profile" className="space-y-6">
                <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" /> Staff Profile Details
                    </CardTitle>
                    <CardDescription>
                      Administrative fields are read-only. Personal details can be updated below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {!teacher ? (
                      <p className="text-sm text-muted-foreground">Teacher profile details not found. Please contact school administration.</p>
                    ) : (
                      <>
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                            <Input value={teacher.name} disabled className="bg-muted/40" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Employee ID</Label>
                            <Input value={teacher.employeeId || "N/A"} disabled className="bg-muted/40" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date of Joining</Label>
                            <Input value={teacher.dateOfJoining || "N/A"} disabled className="bg-muted/40" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Primary Subject</Label>
                            <Input value={teacher.subject} disabled className="bg-muted/40" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assigned Classes</Label>
                            <Input value={assignedClassNames.join(", ") || "None"} disabled className="bg-muted/40" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                            <div>
                              <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                                {teacher.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <hr className="border-muted/60" />

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                            <Input 
                              value={teacherForm.email || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} 
                              placeholder="email@example.com" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                            <Input 
                              value={teacherForm.phone || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} 
                              placeholder="e.g. +233XXXXXXXXX" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Specialization</Label>
                            <Input 
                              value={teacherForm.specialization || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })} 
                              placeholder="e.g. Early Childhood Education" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Qualification</Label>
                            <Input 
                              value={teacherForm.qualification || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })} 
                              placeholder="e.g. B.Ed in English" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bank Name</Label>
                            <Input 
                              value={teacherForm.bankName || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, bankName: e.target.value })} 
                              placeholder="e.g. GCB Bank" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bank Account Number</Label>
                            <Input 
                              value={teacherForm.accountNumber || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, accountNumber: e.target.value })} 
                              placeholder="Account number" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Emergency Contact Phone</Label>
                            <Input 
                              value={teacherForm.emergencyContact || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, emergencyContact: e.target.value })} 
                              placeholder="Emergency contact" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Blood Group</Label>
                            <Input 
                              value={teacherForm.bloodGroup || ""} 
                              onChange={(e) => setTeacherForm({ ...teacherForm, bloodGroup: e.target.value })} 
                              placeholder="e.g. O+" 
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button onClick={handleUpdateTeacherProfile} className="shadow-md">
                            <Save className="mr-2 h-4 w-4" /> Save Profile Details
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password" className="space-y-6">
                <Card className="border-none shadow-md bg-card/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <CardTitle>Change Password</CardTitle>
                    </div>
                    <CardDescription>Securely update your account login password.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" value={pwd.next} onChange={e => setPwd({...pwd, next: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" value={pwd.confirm} onChange={e => setPwd({...pwd, confirm: e.target.value})} />
                    </div>
                    <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">Update Account</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {role === "parent" && (
            <>
              <TabsContent value="profile" className="space-y-6">
                <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Parent Account Information
                    </CardTitle>
                    <CardDescription>
                      Manage your profile display name and view child accounts associated with you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                        <Input 
                          value={parentName} 
                          onChange={(e) => setParentName(e.target.value)} 
                          placeholder="Your full name" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <Input value={auth?.email || ""} disabled className="bg-muted/40" />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={handleUpdateParentProfile} className="shadow-md">
                        <Save className="mr-2 h-4 w-4" /> Save Profile Details
                      </Button>
                    </div>

                    <hr className="border-muted/60" />

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Linked Children ({myStudents.length})
                      </h3>
                      {myStudents.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No children are linked to this parent account yet. Please contact the administrator.</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {myStudents.map((child) => (
                            <div key={child.id} className="flex items-center justify-between p-4 rounded-xl border bg-background/40">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                                  {child.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{child.name}</p>
                                  <p className="text-xs text-muted-foreground">{child.class}</p>
                                </div>
                              </div>
                              <Badge 
                                variant={
                                  child.fees === "Paid" 
                                    ? "default" 
                                    : child.fees === "Partial" 
                                    ? "secondary" 
                                    : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {child.fees || "Unpaid"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password" className="space-y-6">
                <Card className="border-none shadow-md bg-card/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <CardTitle>Change Password</CardTitle>
                    </div>
                    <CardDescription>Securely update your account login password.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" value={pwd.next} onChange={e => setPwd({...pwd, next: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" value={pwd.confirm} onChange={e => setPwd({...pwd, confirm: e.target.value})} />
                    </div>
                    <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">Update Account</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </>
  );
}
