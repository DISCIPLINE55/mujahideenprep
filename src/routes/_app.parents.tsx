import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Link2, Trash2, Mail, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { logActivity } from "@/lib/auth";

export const Route = createFileRoute("/_app/parents")({
  head: () => ({ meta: [{ title: "Parent Accounts — MPSMS" }] }),
  component: ParentsPage,
});

type ParentRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  children: { student_id: string; full_name: string }[];
};

type StudentLite = { id: string; full_name: string };

function ParentsPage() {
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");

  const [linkOpen, setLinkOpen] = useState<string | null>(null);
  const [linkStudentId, setLinkStudentId] = useState("");

  async function load() {
    setLoading(true);
    try {
      // Find users with parent role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "parent");

      const userIds = (roles ?? []).map((r: any) => r.user_id);
      if (userIds.length === 0) {
        setParents([]);
        const { data: s } = await supabase.from("students").select("id, full_name").order("full_name");
        setStudents((s as any) ?? []);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const { data: links } = await supabase
        .from("parent_students")
        .select("parent_user_id, student_id, students(full_name)")
        .in("parent_user_id", userIds);

      const rows: ParentRow[] = (profiles ?? []).map((p: any) => ({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        children: (links ?? [])
          .filter((l: any) => l.parent_user_id === p.id)
          .map((l: any) => ({ student_id: l.student_id, full_name: l.students?.full_name ?? "Unknown" })),
      }));
      setParents(rows);

      const { data: s } = await supabase.from("students").select("id, full_name").order("full_name");
      setStudents((s as any) ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load parents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleInvite() {
    if (!inviteEmail.trim() || !invitePassword.trim()) {
      toast.error("Email and temporary password are required");
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail.trim(),
        password: invitePassword,
        options: { data: { full_name: inviteName, role: "parent" } },
      });
      if (error) throw error;
      // Assign parent role
      if (data.user) {
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "parent" });
        if (roleErr) console.warn(roleErr);
      }
      toast.success("Parent account created. Share the temporary password securely.");
      logActivity(`Created parent account: ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail(""); setInviteName(""); setInvitePassword("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    }
  }

  async function handleLink(parentUserId: string) {
    if (!linkStudentId) return toast.error("Select a student");
    const { error } = await supabase
      .from("parent_students")
      .insert({ parent_user_id: parentUserId, student_id: linkStudentId });
    if (error) return toast.error(error.message);
    toast.success("Student linked");
    setLinkOpen(null); setLinkStudentId("");
    load();
  }

  async function handleUnlink(parentUserId: string, studentId: string) {
    const { error } = await supabase
      .from("parent_students")
      .delete()
      .eq("parent_user_id", parentUserId)
      .eq("student_id", studentId);
    if (error) return toast.error(error.message);
    toast.success("Unlinked");
    load();
  }

  return (
    <>
      <TopBar title="Parent Accounts" />
      <div className="p-4 sm:p-6 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Parents ({parents.length})</CardTitle>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Add Parent</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Parent Account</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5"><Label>Full name</Label><Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Temporary password</Label><Input type="text" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="At least 8 characters" /></div>
                  <p className="text-xs text-muted-foreground">Share this password with the parent. They should change it on first login.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                  <Button onClick={handleInvite}><Mail className="h-4 w-4 mr-1" /> Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : parents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parent accounts yet. Click "Add Parent" to create the first one.</p>
            ) : (
              <div className="space-y-3">
                {parents.map((p) => (
                  <div key={p.user_id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-medium">{p.full_name || "(no name)"}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <Dialog open={linkOpen === p.user_id} onOpenChange={(o) => setLinkOpen(o ? p.user_id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Link2 className="h-4 w-4 mr-1" /> Link Child</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Link a Student</DialogTitle></DialogHeader>
                          <div className="py-2">
                            <Select value={linkStudentId} onValueChange={setLinkStudentId}>
                              <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                              <SelectContent>
                                {students
                                  .filter((s) => !p.children.some((c) => c.student_id === s.id))
                                  .map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setLinkOpen(null)}>Cancel</Button>
                            <Button onClick={() => handleLink(p.user_id)}>Link</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.children.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No children linked</span>
                      ) : (
                        p.children.map((c) => (
                          <Badge key={c.student_id} variant="secondary" className="gap-1">
                            {c.full_name}
                            <button onClick={() => handleUnlink(p.user_id, c.student_id)} className="hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}