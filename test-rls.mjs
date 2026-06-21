import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSecurity() {
  console.log("=== STARTING RLS SECURITY AUDIT ===");

  // 1. Anonymous Access (Should be blocked on protected tables)
  console.log("\n[Test 1] Anonymous Access to Students");
  const { data: anonStudents, error: anonErr } = await supabase.from("students").select("*");
  if (anonErr) {
    console.log("SUCCESS: Anonymous access blocked to students table.", anonErr.message);
  } else if (!anonStudents || anonStudents.length === 0) {
    console.log("SUCCESS: Anonymous users cannot read student data (returned empty array).");
  } else {
    console.error("FAIL: Anonymous users can read student data!", anonStudents.length, "records found.");
  }

  // 2. Anonymous Access to Payments
  console.log("\n[Test 2] Anonymous Access to Payments");
  const { data: anonPayments, error: anonPayErr } = await supabase.from("payments").select("*");
  if (anonPayErr) {
    console.log("SUCCESS: Anonymous access blocked to payments table.", anonPayErr.message);
  } else if (!anonPayments || anonPayments.length === 0) {
    console.log("SUCCESS: Anonymous users cannot read payment data (returned empty array).");
  } else {
    console.error("FAIL: Anonymous users can read payment data!");
  }

  console.log("\n=== RLS SECURITY AUDIT COMPLETE ===");
}

testSecurity();
