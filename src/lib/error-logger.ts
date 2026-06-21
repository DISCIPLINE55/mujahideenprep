import { supabase } from "./supabaseClient";
import { getAuthSync } from "./auth";

type ErrorSeverity = "low" | "medium" | "high" | "critical";

export function logError(
  context: string,
  error: any,
  severity: ErrorSeverity = "high"
) {
  try {
    const auth = getAuthSync();
    const userName = auth?.name || "System/Guest";
    const userRole = auth?.role || "Guest";
    const timestamp = new Date().toISOString();
    
    // Extract meaningful message
    const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
    const actionStr = `[ERROR-${severity.toUpperCase()}] ${context}: ${errorMessage}`;
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`🚨 ERROR LOGGER: ${actionStr}`, error);
    }

    const entry = {
      id: Date.now().toString(36),
      action: actionStr,
      timestamp
    };

    // Store in local fallback first
    const raw = localStorage.getItem("mpsms_activity") || "[]";
    const log = JSON.parse(raw);
    log.unshift(entry);
    localStorage.setItem("mpsms_activity", JSON.stringify(log.slice(0, 50)));

    // Push to Supabase asynchronously
    supabase.from("activity_logs").insert({
      id: entry.id,
      action: entry.action,
      user_name: userName,
      user_role: userRole,
      timestamp: entry.timestamp
    }).then(({ error: dbError }) => {
      if (dbError && import.meta.env.DEV) {
        console.error("Failed to sync error log to Supabase:", dbError);
      }
    });

  } catch (fallbackError) {
    // If the logger itself fails, ensure it doesn't crash the app
    console.error("Logger failed:", fallbackError);
  }
}
