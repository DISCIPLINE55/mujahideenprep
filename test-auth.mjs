import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing auth...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'mujahideen216@gmail.com',
    password: 'Admin@mps216'
  });
  console.log("AUTH RESULT:", JSON.stringify(data, null, 2), error);

  if (data?.user) {
    console.log("Testing profile...");
    // The codebase doesn't have a profiles table in the auth flow, but the user asked for it:
    // "PROFILE RESULT"
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    console.log("PROFILE RESULT:", profile, profileError);

    console.log("Testing role...");
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id);
    console.log("ROLE RESULT:", role, roleError);
  }
}

run();
