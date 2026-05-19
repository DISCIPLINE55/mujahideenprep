import { supabase } from "@/lib/supabaseClient";

// Shared helper to call the school-ai edge function and stream a response into a single string.
export async function callSchoolAI(opts: {
  type: "chat" | "report_comment" | "attendance_insight" | "fee_reminder" | "timetable_suggest";
  prompt: string;
}): Promise<string> {
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
      type: opts.type,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error("AI service unavailable");
  }
  if (!resp.body) throw new Error("No response stream");

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
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return result;
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) result += c;
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  return result;
}
