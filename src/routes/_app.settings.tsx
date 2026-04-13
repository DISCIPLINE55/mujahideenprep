import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Save } from "lucide-react";
import { KEYS, defaultSettings, type SchoolSettings } from "@/lib/storage";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — MPSMS" }, { name: "description", content: "School settings and configuration" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : defaultSettings;
    } catch { return defaultSettings; }
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Motto</Label>
                <Input value={settings.motto} onChange={(e) => setSettings({ ...settings, motto: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic Year Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Current Academic Year</Label>
                <Input value={settings.academicYear} onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Current Term</Label>
                <Input value={settings.currentTerm} onChange={(e) => setSettings({ ...settings, currentTerm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Term Start Date</Label>
                <Input type="date" value={settings.termStart} onChange={(e) => setSettings({ ...settings, termStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Term End Date</Label>
                <Input type="date" value={settings.termEnd} onChange={(e) => setSettings({ ...settings, termEnd: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-success font-medium">✓ Settings saved!</span>}
          <Button onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </div>
    </>
  );
}
