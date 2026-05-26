import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type = "chat" } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
      throw new Error("No AI completion keys configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in your Supabase secrets.");
    }

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

    let apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    let apiAuthHeader = `Bearer ${GEMINI_API_KEY}`;
    let apiModel = "gemini-2.5-flash";

    if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiAuthHeader = `Bearer ${OPENAI_API_KEY}`;
      apiModel = "gpt-4o-mini";
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: apiAuthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("school-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
