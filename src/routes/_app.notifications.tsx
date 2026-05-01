import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Bell, Trash2, Eye } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { KEYS, type Notification } from "@/lib/storage";
import { toast } from "sonner";
import { getAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — MPSMS" },
      { name: "description", content: "School notifications and announcements" },
      { property: "og:title", content: "Notifications — MPSMS" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const store = useStore<Notification>(KEYS.NOTIFICATIONS, []);
  const auth = getAuth();
  const isAdmin = auth?.role === "admin";
  const visible = store.items.filter((n) => {
    if (isAdmin) return true;
    if (n.audience === "All") return true;
    if (auth?.role === "teacher" && n.audience === "Teachers") return true;
    if (auth?.role === "parent" && n.audience === "Parents") return true;
    return false;
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", audience: "All" as "All" | "Teachers" | "Parents", date: new Date().toISOString().split("T")[0] });

  function handleAdd() {
    if (!form.title.trim() || !form.message.trim()) return;
    store.add({ ...form, read: false } as Omit<Notification, "id">);
    setOpen(false);
    setForm({ title: "", message: "", audience: "All", date: new Date().toISOString().split("T")[0] });
    toast.success("Notification created");
  }

  function markRead(n: Notification) {
    store.update({ ...n, read: true });
  }

  function handleDelete(id: string) {
    store.remove(id);
    toast.success("Notification deleted");
  }

  const unread = visible.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Notifications" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Notifications & Announcements</h2>
            <p className="text-sm text-muted-foreground">{visible.length} total • {unread} unread</p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create Notice
            </Button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{isAdmin ? "No notifications yet. Create your first announcement." : "No notifications for you right now."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((n) => (
                <Card key={n.id} className={!n.read ? "border-secondary/40 bg-secondary/5" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{n.title}</h3>
                          {!n.read && <Badge variant="secondary" className="text-xs">New</Badge>}
                          <Badge variant="outline" className="text-xs">{n.audience}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{n.date}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!n.read && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead(n)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(n.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write your message..." rows={4} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v: string) => setForm({ ...form, audience: v as "All" | "Teachers" | "Parents" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Teachers">Teachers</SelectItem>
                    <SelectItem value="Parents">Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
