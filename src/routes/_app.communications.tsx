import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare, Send, Sparkles, Loader2 } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { KEYS, getItems, defaultStudents, defaultClasses, CLASS_LIST, type Student, type SchoolClass } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/communications")({
  head: () => ({
    meta: [
      { title: "Communications — MPSMS" },
      { name: "description", content: "Parent communication and message management" },
    ],
  }),
  component: CommunicationsPage,
});

interface Communication {
  id: string;
  audience: string;
  subject: string;
  message: string;
  date: string;
  status: "Sent" | "Draft";
}

function CommunicationsPage() {
  const store = useStore<Communication>("mpsms_communications", []);
  const students = getItems<Student>(KEYS.STUDENTS, defaultStudents);

  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ audience: "All Parents", subject: "", message: "" });
  const [aiLoading, setAiLoading] = useState(false);

  const audiences = ["All Parents", ...CLASS_LIST.map((c) => `${c} Parents`), ...students.map((s) => `Parent of ${s.name}`)];

  async function handleAIGenerate() {
    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/school-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Write a professional school communication message for: ${form.audience}. Subject: ${form.subject || "General update"}. Keep it concise and professional. Include greeting and sign-off from Mujahideen Preparatory School.` }],
          type: "chat",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) result += c;
          } catch { /* skip */ }
        }
      }

      setForm((f) => ({ ...f, message: result }));
      toast.success("AI message generated!");
    } catch {
      toast.error("Failed to generate AI message");
    }
    setAiLoading(false);
  }

  function handleSend() {
    if (!form.subject.trim() || !form.message.trim()) return;
    store.add({
      audience: form.audience,
      subject: form.subject,
      message: form.message,
      date: new Date().toISOString().split("T")[0],
      status: "Sent",
    } as Omit<Communication, "id">);
    toast.success("Message sent!");
    setComposeOpen(false);
    setForm({ audience: "All Parents", subject: "", message: "" });
  }

  return (
    <>
      <TopBar title="Communications" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Manage communications with parents and guardians</p>
          <Button size="sm" onClick={() => setComposeOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Message</Button>
        </div>

        {store.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No messages sent yet. Click "New Message" to compose.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {[...store.items].reverse().map((msg) => (
              <Card key={msg.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{msg.subject}</h4>
                      <p className="text-xs text-muted-foreground">To: {msg.audience} • {msg.date}</p>
                    </div>
                    <Badge variant={msg.status === "Sent" ? "default" : "secondary"}>{msg.status}</Badge>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-line line-clamp-3">{msg.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Compose Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{audiences.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Message subject" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Message *</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleAIGenerate} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  AI Generate
                </Button>
              </div>
              <Textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Type your message..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={!form.subject.trim() || !form.message.trim()}>
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
