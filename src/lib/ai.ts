import { supabase } from "@/lib/supabaseClient";

export async function streamSchoolAI({
  messages,
  type = "chat",
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: string; content: string }[];
  type?: "chat" | "report_comment" | "attendance_insight" | "fee_reminder" | "timetable_suggest" | "exam_creator";
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    let resp: Response;
    
    if (VITE_GEMINI_API_KEY) {
      // Direct call to Gemini's OpenAI-compatible endpoint in local development
      const systemPrompts: Record<string, string> = {
        chat: `You are an AI assistant for Mujahideen Preparatory School Management System (MPSMS), located in Mankessim, Central Region, Ghana. Established 1997. Levels: Creche, Nursery, KG, Primary 1-6, JHS 1-3.

Help with:
- Student performance analysis and insights
- Attendance trend analysis
- Report card comment writing
- Timetable scheduling suggestions
- Fee reminder drafting
- School administration advice
- Curriculum and teaching guidance

Be professional, helpful, and culturally aware of the Ghanaian educational context. Use British English spelling conventions. Always be encouraging and constructive.`,

        report_comment: `You are a professional teacher at Mujahideen Preparatory School, Mankessim, Ghana. Generate personalized, encouraging report card comments based on the student's scores. Be specific about strengths and areas for improvement. Use British English. Keep comments to 2-3 sentences. Be warm and constructive.`,

        attendance_insight: `You are a data analyst for Mujahideen Preparatory School. Analyze the attendance data provided and give actionable insights. Identify patterns, at-risk students, and recommendations. Be concise and specific. Use British English.`,

        fee_reminder: `You are the administration office of Mujahideen Preparatory School, Mankessim. Draft a polite, professional fee reminder letter/SMS to a parent/guardian. Include the school name, student details, and outstanding amount. Be respectful and firm. Use British English.`,

        timetable_suggest: `You are a timetable coordinator for Mujahideen Preparatory School. Based on the provided data about teachers, subjects, classes, and existing slots, suggest optimal timetable arrangements that avoid conflicts. Be practical and concise. Use British English.`,

        exam_creator: `You are an expert curriculum developer and examiner for Mujahideen Preparatory School, Mankessim, Ghana.
Your job is to generate standard, professional class or terminal examinations.
Strictly follow these rules:
1. Do NOT output any markdown header symbols (like #, ##, ###) or bold markers (like **). Instead, write headers in clean UPPERCASE or spacing, and write bold text in simple capitalization or plain text.
2. Structure the exam with:
   - SECTION A: OBJECTIVE TEST (Multiple choice questions with options A, B, C, D)
   - SECTION B: ESSAY/THEORY (Structured questions requiring written answers)
3. Ensure questions are age-appropriate and relevant to the selected class and subject topics.
4. For questions requiring a diagram, output a clear, simple text/ASCII diagram (e.g. triangles using slashes/underscores, coordinate grids, or tables) and clearly label it, or describe the diagram in detail so the teacher can draw/insert it.
5. Provide a clear marking scheme or key at the very end of the exam paper, separated by a dotted line.`,
      };
      
      const systemMessage = systemPrompts[type] || systemPrompts.chat;
      
      resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${VITE_GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemMessage },
            ...messages,
          ],
          stream: true,
        }),
      });
    } else {
      // Call Supabase Edge Function (production mode)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/school-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages, type }),
      });
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: `Error ${resp.status}` }));
      onError(err.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Network error");
  }
}

// Shared helper to call the school-ai edge function and stream a response into a single string.
export async function callSchoolAI(opts: {
  type: "chat" | "report_comment" | "attendance_insight" | "fee_reminder" | "timetable_suggest" | "exam_creator";
  prompt: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    let result = "";
    streamSchoolAI({
      type: opts.type,
      messages: [{ role: "user", content: opts.prompt }],
      onDelta: (chunk) => {
        result += chunk;
      },
      onDone: () => resolve(result),
      onError: (err) => reject(new Error(err)),
    });
  });
}
