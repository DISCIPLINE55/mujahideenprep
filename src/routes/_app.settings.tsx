import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Download, Upload, Lock } from "lucide-react";
import { KEYS, defaultSettings, exportAllData, importAllData, type SchoolSettings } from "@/lib/storage";
import { getAuth } from "@/lib/auth";
import { toast } from "sonner";
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
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try { const raw = localStorage.getItem(KEYS.SETTINGS); return raw ? JSON.parse(raw) : defaultSettings; } catch { return defaultSettings; }
  });
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    toast.success("Settings saved successfully");
  }

  function toggleDarkMode(checked: boolean) {
    if (checked) { document.documentElement.classList.add("dark"); localStorage.setItem("mpsms_theme", "dark"); }
    else { document.documentElement.classList.remove("dark"); localStorage.setItem("mpsms_theme", "light"); }
  }

  function handleBackup() {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mpsms-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded successfully");
  }

  function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importAllData(text)) {
        toast.success("Data restored successfully — reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  const isDark = typeof window !== "undefined" ? document.documentElement.classList.contains("dark") : false;

  return (
    <>
      <TopBar title="Settings" />
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h2 className="text-xl font-bold text-foreground">School Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your school profile and academic year</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="h-10 w-10 rounded-full" />
              School Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>School Name</Label><Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Motto</Label><Input value={settings.motto} onChange={(e) => setSettings({ ...settings, motto: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Academic Year Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Current Academic Year</Label><Input value={settings.academicYear} onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })} /></div>
              <div className="space-y-2"><Label>Current Term</Label><Input value={settings.currentTerm} onChange={(e) => setSettings({ ...settings, currentTerm: e.target.value })} /></div>
              <div className="space-y-2"><Label>Term Start Date</Label><Input type="date" value={settings.termStart} onChange={(e) => setSettings({ ...settings, termStart: e.target.value })} /></div>
              <div className="space-y-2"><Label>Term End Date</Label><Input type="date" value={settings.termEnd} onChange={(e) => setSettings({ ...settings, termEnd: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Data Backup & Restore</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Export all your school data as a JSON file, or restore from a previous backup.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleBackup}>
                <Download className="mr-1 h-4 w-4" /> Export All Data
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> Import Data
              </Button>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end">
          <Button onClick={handleSave}><Save className="mr-1 h-4 w-4" /> Save Settings</Button>
        </div>
      </div>
    </>
  );
}
