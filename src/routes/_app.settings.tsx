import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Save } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MPSMS" },
      { name: "description", content: "School settings and configuration" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" />
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h2 className="text-xl font-bold text-foreground">School Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your school profile and academic year</p>
        </div>

        {/* School Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              School Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input defaultValue="Mujahideen Preparatory School" />
              </div>
              <div className="space-y-2">
                <Label>Motto</Label>
                <Input defaultValue="Knowledge is Light" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input defaultValue="Mankessim, Central Region" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input defaultValue="+233 24 555 0100" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input defaultValue="info@mujahideenprep.edu.gh" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Year */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic Year Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Current Academic Year</Label>
                <Input defaultValue="2025/2026" />
              </div>
              <div className="space-y-2">
                <Label>Current Term</Label>
                <Input defaultValue="Term 2" />
              </div>
              <div className="space-y-2">
                <Label>Term Start Date</Label>
                <Input type="date" defaultValue="2026-01-06" />
              </div>
              <div className="space-y-2">
                <Label>Term End Date</Label>
                <Input type="date" defaultValue="2026-04-30" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>
            <Save className="mr-1 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </div>
    </>
  );
}
