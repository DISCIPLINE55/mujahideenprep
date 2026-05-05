import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Key in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log(`Connecting to: ${supabaseUrl}`);
  
  try {
    // Try a simple query to a public table that we know exists (or just auth.users if we can't)
    // Actually, calling getSession() is a good way to test if the API is responding
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("❌ Connection failed!");
      console.error(error.message);
    } else {
      console.log("✅ SUCCESSFULLY connected to Supabase!");
      console.log("Supabase is correctly communicating with your app.");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

testConnection();
