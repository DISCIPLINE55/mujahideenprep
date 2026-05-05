import { useState, useRef, useEffect } from "react";
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
  Shield, Key, Settings, UserPlus, ArrowUpCircle, Smartphone, Wallet 
} from "lucide-react";
import { KEYS, defaultSettings, CLASS_LIST, setItems, getItems, defaultStudents, generateId, type SchoolSettings, type Student, type FeeStructure } from "@/lib/storage";
import { getAuthSync } from "@/lib/auth";
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
        const { data: logData } = await supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }).limit(20);
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

  const updateGrade = (index: number, field: string, value: any) => {
    const newScales = [...settings.gradingScales];
    newScales[index] = { ...newScales[index], [field]: value };
    setSettings({ ...settings, gradingScales: newScales });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Sparkles className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      <TopBar title="System Configuration" />
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
            <p className="text-muted-foreground">Manage school identity, academic rules, and system integrations.</p>
          </div>
          <Button onClick={handleSave} size="lg" className="shadow-lg">
            <Save className="mr-2 h-4 w-4" /> Save Configuration
          </Button>
        </div>

        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="identity" className="rounded-lg py-2 px-4"><School className="h-4 w-4 mr-2" /> School Identity</TabsTrigger>
            <TabsTrigger value="academics" className="rounded-lg py-2 px-4"><GraduationCap className="h-4 w-4 mr-2" /> Academics</TabsTrigger>
            <TabsTrigger value="fees" className="rounded-lg py-2 px-4"><Wallet className="h-4 w-4 mr-2" /> Fees</TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg py-2 px-4"><Settings className="h-4 w-4 mr-2" /> Integrations</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg py-2 px-4"><Shield className="h-4 w-4 mr-2" /> Security & Logs</TabsTrigger>
            <TabsTrigger value="danger" className="rounded-lg py-2 px-4 text-destructive"><Database className="h-4 w-4 mr-2" /> Danger Zone</TabsTrigger>
          </TabsList>

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
                <div className="rounded-xl border bg-background/50 overflow-hidden">
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
              <CardHeader><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><CardTitle>System Activity Audit</CardTitle></div></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge variant={log.user_role === 'admin' ? 'default' : 'secondary'}>{log.user_role}</Badge>
                        <span className="font-medium">{log.action}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-center text-muted-foreground py-4">No recent logs found.</p>}
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
        </Tabs>
      </div>
    </>
  );
}
