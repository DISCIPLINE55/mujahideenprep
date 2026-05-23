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
import { Plus, Link2, Trash2, Mail, Users, Pencil } from "lucide-react";
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
  children: { student_id: string; name: string }[];
};

type StudentLite = { id: string; name: string };

function ParentsPage() {
  const [parents, setParents] = useState<ParentRow[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("mpsms_parents_cache") : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [students, setStudents] = useState<StudentLite[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("mpsms_students_lite_cache") : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(parents.length === 0);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");

  const [linkOpen, setLinkOpen] = useState<string | null>(null);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [editParent, setEditParent] = useState<ParentRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  async function load(silent = false) {
    if (!silent && parents.length === 0) setLoading(true);
    try {
      // Find users with parent role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "parent");

      const userIds = (roles ?? []).map((r: any) => r.user_id);
      if (userIds.length === 0) {
        setParents([]);
        localStorage.setItem("mpsms_parents_cache", "[]");
        const { data: s } = await supabase.from("students").select("id, name").order("name");
        if (s) {
          setStudents(s as any);
          localStorage.setItem("mpsms_students_lite_cache", JSON.stringify(s));
        }
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const { data: links } = await supabase
        .from("parent_students")
        .select("parent_user_id, student_id, students(name)")
        .in("parent_user_id", userIds);

      const rows: ParentRow[] = (profiles ?? []).map((p: any) => ({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        children: (links ?? [])
          .filter((l: any) => l.parent_user_id === p.id)
          .map((l: any) => ({ student_id: l.student_id, name: l.students?.name ?? "Unknown" })),
      }));
      setParents(rows);
      localStorage.setItem("mpsms_parents_cache", JSON.stringify(rows));

      const { data: s } = await supabase.from("students").select("id, name").order("name");
      if (s) {
        setStudents(s as any);
        localStorage.setItem("mpsms_students_lite_cache", JSON.stringify(s));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load parents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(true); }, []);

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

  async function handleEditParent() {
    if (!editParent) return;
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const loader = toast.loading("Updating parent account...");
    try {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ full_name: editName.trim(), email: editEmail.trim() })
        .eq("id", editParent.user_id);
      if (profileErr) throw profileErr;

      toast.success("Parent account updated successfully!", { id: loader });
      logActivity(`Updated parent account: ${editEmail}`);
      setEditParent(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update parent profile", { id: loader });
    }
  }

  async function handleDeleteParent(userId: string) {
    if (!confirm("Are you sure you want to delete this parent account? This will unlink all their children and remove their profile.")) return;
    const loader = toast.loading("Deleting parent account...");
    try {
      const { error: unlinkErr } = await supabase
        .from("parent_students")
        .delete()
        .eq("parent_user_id", userId);
      if (unlinkErr) throw unlinkErr;

      const { error: roleErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "parent");
      if (roleErr) throw roleErr;

      const { error: profileErr } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (profileErr) throw profileErr;

      toast.success("Parent account deleted successfully!", { id: loader });
      logActivity(`Deleted parent account`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete parent account", { id: loader });
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
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditParent(p);
                          setEditName(p.full_name || "");
                          setEditEmail(p.email || "");
                          setEditPassword("");
                        }}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteParent(p.user_id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <Dialog open={linkOpen === p.user_id} onOpenChange={(o) => {
                          setLinkOpen(o ? p.user_id : null);
                          if (o) {
                            setStudentSearch("");
                            setLinkStudentId("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline"><Link2 className="h-4 w-4 mr-1" /> Link Child</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader><DialogTitle>Link a Student</DialogTitle></DialogHeader>
                            <div className="space-y-3 py-2">
                              <div className="space-y-1.5">
                                <Label>Search Students</Label>
                                <Input
                                  placeholder="Type student name to search..."
                                  value={studentSearch}
                                  onChange={(e) => setStudentSearch(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                              <div className="border rounded-md p-1 max-h-48 overflow-y-auto space-y-1">
                                {students
                                  .filter((s) => !p.children.some((c) => c.student_id === s.id))
                                  .filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-4">No students found matching "{studentSearch}"</p>
                                ) : (
                                  students
                                    .filter((s) => !p.children.some((c) => c.student_id === s.id))
                                    .filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                                    .map((s) => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setLinkStudentId(s.id)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
                                          linkStudentId === s.id
                                            ? "bg-primary text-primary-foreground font-semibold"
                                            : "hover:bg-secondary/40 text-foreground"
                                        }`}
                                      >
                                        <span>{s.name}</span>
                                        {linkStudentId === s.id && <span className="text-xs font-semibold">Selected</span>}
                                      </button>
                                    ))
                                )}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setLinkOpen(null)}>Cancel</Button>
                              <Button onClick={() => handleLink(p.user_id)}>Link</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.children.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No children linked</span>
                      ) : (
                        p.children.map((c) => (
                          <Badge key={c.student_id} variant="secondary" className="gap-1">
                            {c.name}
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
      <Dialog open={!!editParent} onOpenChange={(o) => { if (!o) setEditParent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" /> Update Parent Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@address.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditParent(null)}>Cancel</Button>
            <Button onClick={handleEditParent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}