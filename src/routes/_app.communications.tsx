import { useState, useMemo } from "react";
import { getAuthSync } from "@/lib/auth";
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
import { Plus, MessageSquare, Send, Sparkles, Loader2, Bold, Italic, List, Users } from "lucide-react";
import { BulkWhatsAppDialog, type Recipient } from "@/components/BulkWhatsAppDialog";
import { stripMarkdown } from "@/lib/utils";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useStore } from "@/hooks/use-store";
import { KEYS, getItems, defaultStudents, defaultClasses, CLASS_LIST, type Student, type SchoolClass } from "@/lib/storage";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

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
  recipients: string;
  subject: string;
  body: string;
  date: string;
  status: "Sent" | "Draft";
  sender: string;
}

function CommunicationsPage() {
  const auth = getAuthSync();
  const store = useStore<Communication>(KEYS.COMMUNICATIONS, []);
  const studentStore = useStore<Student>(KEYS.STUDENTS, defaultStudents);
  const students = studentStore.items;

  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ audience: "All Parents", subject: "", message: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRecipients, setBulkRecipients] = useState<Recipient[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type your message..." })
    ],
    content: form.message,
    onUpdate: ({ editor }) => {
      setForm((f) => ({ ...f, message: editor.getHTML() }));
    }
  });

  const audiences = ["All Parents", ...CLASS_LIST.map((c) => `${c} Parents`), ...students.map((s) => `Parent of ${s.name}`)];

  async function handleAIGenerate() {
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/school-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
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

      const formattedResult = `<p>${result.replace(/\n/g, '<br>')}</p>`;
      setForm((f) => ({ ...f, message: formattedResult }));
      editor?.commands.setContent(formattedResult);
      toast.success("AI message generated!");
    } catch {
      toast.error("Failed to generate AI message");
    }
    setAiLoading(false);
  }

  function handleSend() {
    if (!form.subject.trim() || !form.message.trim()) return;
    store.add({
      recipients: form.audience,
      subject: form.subject,
      body: form.message,
      date: new Date().toISOString().split("T")[0],
      status: "Sent",
      sender: auth?.name || "Admin",
    } as Omit<Communication, "id">);
    toast.success("Message sent!");
    setComposeOpen(false);
    setForm({ audience: "All Parents", subject: "", message: "" });
    editor?.commands.setContent("");
  }

  function handleWhatsAppSend() {
    if (!form.message.trim()) return;
    
    let targetStudents: Student[] = [];
    if (form.audience === "All Parents") {
      targetStudents = students;
    } else if (form.audience.endsWith(" Parents")) {
      const className = form.audience.replace(" Parents", "");
      targetStudents = students.filter(s => s.class === className);
    } else if (form.audience.startsWith("Parent of ")) {
      const studentName = form.audience.replace("Parent of ", "");
      targetStudents = students.filter(s => s.name === studentName);
    }

    const recipients: Recipient[] = targetStudents
      .filter(s => s.phone || s.emergencyContactPhone)
      .map(s => ({
        id: s.id,
        name: s.name,
        guardian: s.guardian || "Guardian",
        phone: s.phone || s.emergencyContactPhone || "",
        message: `${form.subject ? `*${form.subject}*\n\n` : ""}${stripMarkdown(editor?.getText() || "")}`,
        status: "pending"
      }));

    if (recipients.length === 0) {
      toast.warning("No recipients with valid phone numbers found for this audience.");
      return;
    }

    setBulkRecipients(recipients);
    setBulkOpen(true);
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
                      <p className="text-xs text-muted-foreground">To: {msg.recipients} • {msg.date}</p>
                    </div>
                    <Badge variant={msg.status === "Sent" ? "default" : "secondary"}>{msg.status}</Badge>
                  </div>
                  <div 
                    className="text-sm text-foreground/80 prose prose-sm dark:prose-invert line-clamp-3 max-w-none" 
                    dangerouslySetInnerHTML={{ __html: msg.body }} 
                  />
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
              <div className="border rounded-md overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-ring">
                <div className="bg-muted/50 border-b p-1 flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor?.chain().focus().toggleBold().run()} data-active={editor?.isActive('bold') ? 'true' : 'false'}>
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor?.chain().focus().toggleItalic().run()} data-active={editor?.isActive('italic') ? 'true' : 'false'}>
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor?.chain().focus().toggleBulletList().run()} data-active={editor?.isActive('bulletList') ? 'true' : 'false'}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-3 min-h-[150px] cursor-text" onClick={() => editor?.commands.focus()}>
                  <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none dark:prose-invert [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <div className="flex gap-2">
              <Button variant="outline" className="text-success border-success/30 hover:bg-success/5" onClick={handleWhatsAppSend} disabled={!form.message.trim()}>
                <Users className="h-4 w-4 mr-1" /> Send via WhatsApp
              </Button>
              <Button onClick={handleSend} disabled={!form.subject.trim() || !form.message.trim()}>
                <Send className="h-4 w-4 mr-1" /> Send to Portal
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkWhatsAppDialog 
        open={bulkOpen} 
        onOpenChange={setBulkOpen} 
        recipients={bulkRecipients} 
        title={`Bulk WhatsApp: ${form.audience}`}
      />
    </>
  );
}
