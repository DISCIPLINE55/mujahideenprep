import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// These are injected at build time by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIG_ERROR = !supabaseUrl || !supabaseAnonKey
  ? 'Missing Supabase client environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) for production.'
  : undefined;

if (SUPABASE_CONFIG_ERROR) {
  console.error(SUPABASE_CONFIG_ERROR);
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
