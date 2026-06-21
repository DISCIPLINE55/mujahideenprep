/**
 * Centralized Error Formatting Utility
 * Translates technical errors into user-friendly messages.
 */

export function formatError(error: any): string {
  if (!error) return "An unexpected error occurred.";

  const message = typeof error === "string" ? error : error?.message || "";

  // Network & Connectivity Errors
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Authentication & Session Errors
  if (message.includes("JWT expired") || message.includes("Auth session missing") || message.includes("not authenticated")) {
    return "Your session has expired. Please sign in again.";
  }
  if (message.includes("Invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }

  // Permission Errors
  if (message.includes("RLS policy violation") || message.includes("permission denied") || message.includes("unauthorized")) {
    return "You do not have permission to perform this action.";
  }

  // Database / Save Errors
  if (message.includes("duplicate key value") || message.includes("already exists")) {
    return "This record already exists. Please use a unique value.";
  }
  if (message.includes("Database insert failed") || message.includes("foreign key constraint")) {
    return "Unable to save your changes. Please ensure all required fields are correct and try again.";
  }
  if (message.includes("timeout") || message.includes("503") || message.includes("unavailable")) {
    return "School services are temporarily unavailable. Please try again shortly.";
  }

  // AI Specific Errors
  if (message.includes("AI generation failed") || message.includes("Gemini API")) {
    return "The AI assistant is currently overwhelmed or unavailable. Please retry in a few moments.";
  }

  // Fallback for unhandled developer errors
  console.warn("Unmapped error encountered:", error);
  return "We encountered an issue processing your request. Please try again or contact the administrator.";
}
