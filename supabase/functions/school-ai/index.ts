import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type = "chat" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!LOVABLE_API_KEY && !OPENAI_API_KEY && !GEMINI_API_KEY) {
      throw new Error("No AI completion keys configured. Please set LOVABLE_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in your Supabase secrets.");
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
    };

    const systemMessage = systemPrompts[type] || systemPrompts.chat;

    let apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let apiAuthHeader = `Bearer ${LOVABLE_API_KEY}`;
    let apiModel = "google/gemini-3-flash-preview";

    if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiAuthHeader = `Bearer ${OPENAI_API_KEY}`;
      apiModel = "gpt-4o-mini";
    } else if (GEMINI_API_KEY) {
      apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      apiAuthHeader = `Bearer ${GEMINI_API_KEY}`;
      apiModel = "gemini-2.5-flash";
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
